import * as THREE from 'three';
import { ScientificModelSpec } from '../../types/aiModel';
import {
  calculateChemicalKineticsMetrics,
  calculateChemicalEquilibriumMetrics,
  calculateReactionEnergyProfileMetrics,
  calculateCatalysisMetrics,
  calculateTitrationMetrics,
  calculateSolubilityPrecipitationMetrics,
  calculateBufferSolutionMetrics,
} from './chemistryBatch2Engine';

/**
 * TECH-ANATOMIX: DISSECT YOUR CELL! — CHEMISTRY BATCH 2 3D STUDIO BUILDER & ANIMATOR (MODELS 76–82)
 *
 * Builds and animates interactive 3D scientific assemblies, dynamic canvas graphs,
 * and quantitative readout boards for:
 * - 76: 'chemical-kinetics-simulator'
 * - 77: 'chemical-equilibrium-explorer'
 * - 78: 'reaction-energy-profile-explorer'
 * - 79: 'catalysis-explorer'
 * - 80: 'acid-base-titration-laboratory'
 * - 81: 'solubility-precipitation-explorer'
 * - 82: 'buffer-solution-simulator'
 */

export const CHEMISTRY_BATCH_2_MODEL_IDS = new Set<string>([
  'chemical-kinetics-simulator',
  'chemical-equilibrium-explorer',
  'reaction-energy-profile-explorer',
  'catalysis-explorer',
  'acid-base-titration-laboratory',
  'solubility-precipitation-explorer',
  'buffer-solution-simulator',
]);

export function isChemistryBatch2Model(
  functionalTypeOrId?: string,
  modelId?: string
): boolean {
  if (functionalTypeOrId && CHEMISTRY_BATCH_2_MODEL_IDS.has(functionalTypeOrId)) {
    return true;
  }
  if (modelId && CHEMISTRY_BATCH_2_MODEL_IDS.has(modelId)) {
    return true;
  }
  return false;
}

function tagInteractivePart(
  root: THREE.Object3D,
  partId: string,
  partGroup?: THREE.Object3D,
  interactiveMeshes?: THREE.Object3D[]
) {
  const partSpec = partGroup?.userData?.partSpec;
  root.traverse((child) => {
    child.userData = {
      ...child.userData,
      partId,
      componentId: partId,
      ...(partSpec ? { partSpec, componentName: partSpec.label || partSpec.name } : {}),
    };
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
      if (interactiveMeshes && !interactiveMeshes.includes(m)) {
        interactiveMeshes.push(m);
      }
    }
  });
}

function hidePlaceholderMesh(partGroup: THREE.Object3D) {
  if ((partGroup as THREE.Mesh).isMesh && !partGroup.userData.isBatch2StudioCustom) {
    const selfMesh = partGroup as THREE.Mesh;
    selfMesh.material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
  }
  partGroup.children.forEach((child) => {
    if ((child as THREE.Mesh).isMesh && !child.userData.isBatch2StudioCustom) {
      child.visible = false;
    }
  });
}

function getOrCreateStudioAssembly(partGroup: THREE.Object3D, key: string): THREE.Group {
  const existing = partGroup.getObjectByName(key) as THREE.Group | undefined;
  if (existing) return existing;
  hidePlaceholderMesh(partGroup);
  const sub = new THREE.Group();
  sub.name = key;
  sub.userData.isBatch2StudioCustom = true;
  partGroup.add(sub);
  return sub;
}

interface DynamicBoardRef {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  lastSignature: string;
}

function createDynamicCanvasBoard(
  widthWorld: number,
  heightWorld: number,
  pxWidth = 768,
  pxHeight = 512
): DynamicBoardRef {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    canvas = document.createElement('canvas');
    canvas.width = pxWidth;
    canvas.height = pxHeight;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
  } else {
    canvas = { width: pxWidth, height: pxHeight } as unknown as HTMLCanvasElement;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  const geo = new THREE.PlaneGeometry(widthWorld, heightWorld);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isBatch2StudioCustom = true;
  return {
    canvas,
    ctx: (ctx || createNoopCanvasContext()) as CanvasRenderingContext2D,
    texture,
    mesh,
    lastSignature: '',
  };
}

function createNoopCanvasContext(): Partial<CanvasRenderingContext2D> {
  const noop = () => {};
  return {
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    arc: noop,
    setLineDash: noop,
    createLinearGradient: () =>
      ({
        addColorStop: noop,
      }) as unknown as CanvasGradient,
  };
}

function drawRoundedPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  borderColor = '#38BDF8'
) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0B1325');
  grad.addColorStop(1, '#111C33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

export interface ChemistryBatch2SceneHandles {
  modelId: string;
  partMeshes: Map<string, THREE.Group>;
}

// ============================================================================
// BUILDER ENTRY POINT
// ============================================================================
export function buildChemistryBatch2CustomAssemblies(
  model: ScientificModelSpec,
  partMeshesOrRoot: Map<string, THREE.Group> | THREE.Group,
  maybeMeshMap?: Map<string, THREE.Object3D> | Record<string, THREE.Object3D>,
  interactiveMeshes?: THREE.Object3D[]
): ChemistryBatch2SceneHandles | null {
  if (!isChemistryBatch2Model(model.functionalType, model.id)) return null;

  let partMeshes: Map<string, THREE.Group>;
  if (partMeshesOrRoot instanceof Map) {
    partMeshes = partMeshesOrRoot;
  } else if (maybeMeshMap instanceof Map) {
    partMeshes = maybeMeshMap as Map<string, THREE.Group>;
  } else if (maybeMeshMap && typeof maybeMeshMap === 'object') {
    partMeshes = new Map(Object.entries(maybeMeshMap)) as Map<string, THREE.Group>;
  } else {
    return null;
  }

  switch (model.id) {
    case 'chemical-kinetics-simulator':
      buildChemicalKineticsScene(partMeshes);
      break;
    case 'chemical-equilibrium-explorer':
      buildChemicalEquilibriumScene(partMeshes);
      break;
    case 'reaction-energy-profile-explorer':
      buildReactionEnergyProfileScene(partMeshes);
      break;
    case 'catalysis-explorer':
      buildCatalysisExplorerScene(partMeshes);
      break;
    case 'acid-base-titration-laboratory':
      buildAcidBaseTitrationScene(partMeshes);
      break;
    case 'solubility-precipitation-explorer':
      buildSolubilityPrecipitationScene(partMeshes);
      break;
    case 'buffer-solution-simulator':
      buildBufferSolutionScene(partMeshes);
      break;
  }

  // Ensure all custom meshes carry partSpec and are registered in interactiveMeshes for 3D selection
  partMeshes.forEach((partObj, partId) => {
    tagInteractivePart(partObj, partId, partObj, interactiveMeshes);
  });

  return { modelId: model.id, partMeshes };
}

// ============================================================================
// MODEL 76: CHEMICAL KINETICS SIMULATOR BUILDER
// ============================================================================
function buildChemicalKineticsScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Reaction Vessel
  const vesselGroup = partMeshes.get('reaction_vessel');
  if (vesselGroup) {
    const sub = getOrCreateStudioAssembly(vesselGroup, 'kinetics_vessel_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(1.45, 1.45, 3.1, 36, 1, true),
        glassMat
      );
      sub.add(wall);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.7,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.65, 0.25, 36), baseMat);
      base.position.y = -1.65;
      sub.add(base);

      const topRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 16, 40), baseMat);
      topRing.rotation.x = Math.PI / 2;
      topRing.position.y = 1.55;
      sub.add(topRing);

      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0x7c2d12,
        emissiveIntensity: 0.35,
        metalness: 0.6,
        roughness: 0.3,
      });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 12, 36), coilMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -1.1;
      coil.name = 'thermal_coil';
      sub.add(coil);

      tagInteractivePart(sub, 'reaction_vessel');
    }
  }

  // 2. Reactant Particles + Collision Flash Ring
  const reactGroup = partMeshes.get('reactant_particles');
  if (reactGroup) {
    const sub = getOrCreateStudioAssembly(reactGroup, 'kinetics_reactants_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });
      const geo = new THREE.SphereGeometry(0.14, 16, 16);
      for (let i = 0; i < 18; i++) {
        const sp = new THREE.Mesh(geo, mat);
        const angle = (i / 18) * Math.PI * 2;
        const r = 0.25 + (i % 3) * 0.32;
        const y = -1.1 + (i % 6) * 0.42;
        sp.position.set(0.4 + Math.cos(angle) * r, y - 0.3, -0.2 + Math.sin(angle) * r);
        sp.userData.seed = i;
        sub.add(sp);
      }

      const flashMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const flashRing = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.28, 24), flashMat);
      flashRing.position.set(0.4, -0.2, -0.2);
      flashRing.name = 'collision_flash_ring';
      sub.add(flashRing);

      tagInteractivePart(sub, 'reactant_particles');
    }
  }

  // 3. Product Particles
  const prodGroup = partMeshes.get('product_particles');
  if (prodGroup) {
    const sub = getOrCreateStudioAssembly(prodGroup, 'kinetics_products_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x065f46,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });
      const geo = new THREE.SphereGeometry(0.15, 16, 16);
      for (let i = 0; i < 18; i++) {
        const sp = new THREE.Mesh(geo, mat);
        const angle = (i / 18) * Math.PI * 2 + 0.5;
        const r = 0.28 + (i % 3) * 0.3;
        const y = -1.0 + (i % 6) * 0.4;
        sp.position.set(-0.4 + Math.cos(angle) * r, y + 0.3, 0.2 + Math.sin(angle) * r);
        sp.userData.seed = i;
        sub.add(sp);
      }
      tagInteractivePart(sub, 'product_particles');
    }
  }

  // 4. Reaction Progress Indicator
  const progGroup = partMeshes.get('reaction_progress_indicator');
  if (progGroup) {
    const sub = getOrCreateStudioAssembly(progGroup, 'kinetics_progress_custom');
    if (sub.children.length === 0) {
      const trackMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.6,
        roughness: 0.4,
      });
      const track = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.28, 0.28), trackMat);
      sub.add(track);

      const fillMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.5,
      });
      const fill = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 0.32), fillMat);
      fill.name = 'progress_fill_bar';
      sub.add(fill);
      tagInteractivePart(sub, 'reaction_progress_indicator');
    }
  }

  // 5. Concentration-Time Graph Board
  const graphGroup = partMeshes.get('concentration_time_graph');
  if (graphGroup) {
    const sub = getOrCreateStudioAssembly(graphGroup, 'kinetics_graph_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 2.55, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);

      const board = createDynamicCanvasBoard(3.7, 2.4, 768, 512);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'concentration_time_graph');
    }
  }

  // 6. Rate Constant & Half-Life Display Board
  const rateGroup = partMeshes.get('rate_constant_display');
  if (rateGroup) {
    const sub = getOrCreateStudioAssembly(rateGroup, 'kinetics_rate_board_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 1.35, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);

      const board = createDynamicCanvasBoard(3.7, 1.2, 768, 256);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'rate_constant_display');
    }
  }
}

// ============================================================================
// MODEL 77: CHEMICAL EQUILIBRIUM EXPLORER BUILDER
// ============================================================================
function buildChemicalEquilibriumScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Equilibrium Reaction Vessel with Movable Piston ('equilibrium_reactor_cylinder')
  const vesselGroup = partMeshes.get('equilibrium_reactor_cylinder');
  if (vesselGroup) {
    const sub = getOrCreateStudioAssembly(vesselGroup, 'eq_vessel_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3.1, 36, 1, true),
        glassMat
      );
      sub.add(cyl);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.7,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.7, 0.25, 36), baseMat);
      base.position.y = -1.65;
      sub.add(base);

      const pistonGroup = new THREE.Group();
      pistonGroup.name = 'movable_piston';
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.8,
        roughness: 0.25,
      });
      const head = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 0.22, 32), headMat);
      pistonGroup.add(head);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 16), headMat);
      rod.position.y = 0.65;
      pistonGroup.add(rod);
      pistonGroup.position.y = 1.2;
      sub.add(pistonGroup);

      tagInteractivePart(sub, 'equilibrium_reactor_cylinder');
    }
  }

  // 2. Reactant Species Cloud
  const reactGroup = partMeshes.get('reactant_species_cloud');
  if (reactGroup) {
    const sub = getOrCreateStudioAssembly(reactGroup, 'eq_reactant_cloud_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.4,
        roughness: 0.25,
      });
      const geo = new THREE.SphereGeometry(0.15, 16, 16);
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(geo, mat);
        m.userData.seed = i;
        sub.add(m);
      }
      tagInteractivePart(sub, 'reactant_species_cloud');
    }
  }

  // 3. Product Species Cloud
  const prodGroup = partMeshes.get('product_species_cloud');
  if (prodGroup) {
    const sub = getOrCreateStudioAssembly(prodGroup, 'eq_product_cloud_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xc2410c,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });
      const geo = new THREE.SphereGeometry(0.14, 16, 16);
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(geo, mat);
        m.userData.seed = i;
        sub.add(m);
      }
      tagInteractivePart(sub, 'product_species_cloud');
    }
  }

  // 4. Forward Reaction Indicator ('forward_reaction_indicator')
  const fwdPart = partMeshes.get('forward_reaction_indicator');
  if (fwdPart) {
    const sub = getOrCreateStudioAssembly(fwdPart, 'eq_fwd_arrow_custom');
    if (sub.children.length === 0) {
      const fwdMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.55,
      });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16), fwdMat);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 16), fwdMat);
      cone.position.y = 0.9;
      sub.add(shaft, cone);
      tagInteractivePart(sub, 'forward_reaction_indicator');
    }
  }

  // 5. Reverse Reaction Indicator ('reverse_reaction_indicator')
  const revPart = partMeshes.get('reverse_reaction_indicator');
  if (revPart) {
    const sub = getOrCreateStudioAssembly(revPart, 'eq_rev_arrow_custom');
    if (sub.children.length === 0) {
      const revMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.55,
      });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16), revMat);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 16), revMat);
      cone.position.y = 0.9;
      sub.add(shaft, cone);
      tagInteractivePart(sub, 'reverse_reaction_indicator');
    }
  }

  // 6. Q vs K Equilibrium Display + Concentration Graph ('q_vs_k_equilibrium_display')
  const qGroup = partMeshes.get('q_vs_k_equilibrium_display');
  if (qGroup) {
    const sub = getOrCreateStudioAssembly(qGroup, 'eq_quotient_board_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 2.85, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(3.75, 2.7, 768, 550);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'q_vs_k_equilibrium_display');
    }
  }
}

// ============================================================================
// MODEL 78: REACTION ENERGY PROFILE EXPLORER BUILDER
// ============================================================================
function buildReactionEnergyProfileScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Reactant Region ('reactant_region')
  const rPlat = partMeshes.get('reactant_region');
  if (rPlat) {
    const sub = getOrCreateStudioAssembly(rPlat, 'ep_reactant_plat_custom');
    if (sub.children.length === 0) {
      const plat = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.22, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.3 })
      );
      sub.add(plat);
      const s1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.2 })
      );
      s1.position.set(-0.22, 0.32, 0);
      const s2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2 })
      );
      s2.position.set(0.22, 0.32, 0);
      sub.add(s1, s2);
      tagInteractivePart(sub, 'reactant_region');
    }
  }

  // 2. Product Region ('product_region')
  const pPlat = partMeshes.get('product_region');
  if (pPlat) {
    const sub = getOrCreateStudioAssembly(pPlat, 'ep_product_plat_custom');
    if (sub.children.length === 0) {
      const plat = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.22, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.3 })
      );
      sub.add(plat);
      const s1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.2 })
      );
      s1.position.set(-0.2, 0.32, 0);
      const s2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 })
      );
      s2.position.set(0.2, 0.32, 0);
      sub.add(s1, s2);
      tagInteractivePart(sub, 'product_region');
    }
  }

  // 3. Reaction-Progress Pathway + Annotated Energy Profile Board ('reaction_progress_pathway')
  const pathGroup = partMeshes.get('reaction_progress_pathway');
  if (pathGroup) {
    const sub = getOrCreateStudioAssembly(pathGroup, 'ep_pathway_tube_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x6b21a8,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });
      const dummyCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6, -0.3, 0),
        new THREE.Vector3(0, 1.5, 0),
        new THREE.Vector3(2.6, -0.8, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(dummyCurve, 48, 0.08, 14, false), mat);
      tube.name = 'dynamic_energy_tube';
      sub.add(tube);

      // Backboard displaying the calibrated Energy Profile Graph
      const boardHolder = new THREE.Group();
      boardHolder.name = 'ep_backdrop_board_holder';
      boardHolder.rotation.z = -Math.PI / 2;
      boardHolder.position.set(0, 0.5, -1.35);
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(4.45, 2.75, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      boardHolder.add(frame);
      const board = createDynamicCanvasBoard(4.3, 2.6, 768, 520);
      board.mesh.position.z = 0.06;
      boardHolder.userData.dynamicBoard = board;
      boardHolder.add(board.mesh);
      sub.add(boardHolder);

      tagInteractivePart(sub, 'reaction_progress_pathway');
    }
  }

  // 4. Transition-State Indicator + Travelling Molecular Complex ('transition_state_indicator')
  const tsGroup = partMeshes.get('transition_state_indicator');
  if (tsGroup) {
    const sub = getOrCreateStudioAssembly(tsGroup, 'ep_ts_indicator_custom');
    if (sub.children.length === 0) {
      const peakSphere = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 2),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 0.65,
          roughness: 0.2,
        })
      );
      peakSphere.name = 'ts_peak_beacon';
      sub.add(peakSphere);

      const traveller = new THREE.Group();
      traveller.name = 'coordinate_traveller';
      const aAtom = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 18),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.4,
        })
      );
      aAtom.name = 'atom_a';
      aAtom.position.x = -0.28;
      const bAtom = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 18, 18),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xca8a04,
          emissiveIntensity: 0.5,
        })
      );
      bAtom.name = 'atom_b';
      const cAtom = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 18),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.4,
        })
      );
      cAtom.name = 'atom_c';
      cAtom.position.x = 0.28;
      traveller.add(aAtom, bAtom, cAtom);
      sub.add(traveller);

      tagInteractivePart(sub, 'transition_state_indicator');
    }
  }

  // 5. Activation-Energy Marker ('activation_energy_marker')
  const eaGroup = partMeshes.get('activation_energy_marker');
  if (eaGroup) {
    const sub = getOrCreateStudioAssembly(eaGroup, 'ep_ea_marker_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xb45309,
        emissiveIntensity: 0.5,
      });
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 14), mat);
      pillar.name = 'ea_pillar';
      sub.add(pillar);
      const topCone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 14), mat);
      topCone.name = 'ea_top_cone';
      topCone.position.y = 0.55;
      sub.add(topCone);
      tagInteractivePart(sub, 'activation_energy_marker');
    }
  }

  // 6. Reaction-Enthalpy Marker ('reaction_enthalpy_marker')
  const dhGroup = partMeshes.get('reaction_enthalpy_marker');
  if (dhGroup) {
    const sub = getOrCreateStudioAssembly(dhGroup, 'ep_dh_marker_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        emissive: 0x9d174d,
        emissiveIntensity: 0.5,
      });
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 14), mat);
      pillar.name = 'dh_pillar';
      sub.add(pillar);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 14), mat);
      cap.position.y = -0.5;
      cap.rotation.x = Math.PI;
      sub.add(cap);
      tagInteractivePart(sub, 'reaction_enthalpy_marker');
    }
  }
}

// ============================================================================
// MODEL 79: CATALYSIS EXPLORER BUILDER
// ============================================================================
function buildCatalysisExplorerScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Catalyst Active Structure ('catalyst_active_structure')
  const surfGroup = partMeshes.get('catalyst_active_structure');
  if (surfGroup) {
    const sub = getOrCreateStudioAssembly(surfGroup, 'cat_surface_custom');
    if (sub.children.length === 0) {
      const ptSlab = new THREE.Group();
      ptSlab.name = 'heterogeneous_pt_slab';
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2,
      });
      const activeSiteMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.2,
      });
      for (let gx = -2; gx <= 2; gx++) {
        for (let gz = -1; gz <= 1; gz++) {
          const isSite = (gx + gz) % 2 === 0;
          const atom = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 18, 18),
            isSite ? activeSiteMat : metalMat
          );
          atom.position.set(gx * 0.52, 0, gz * 0.52);
          ptSlab.add(atom);
        }
      }
      sub.add(ptSlab);

      const homoCenter = new THREE.Group();
      homoCenter.name = 'homogeneous_cat_center';
      const coreIon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 2),
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x6b21a8,
          emissiveIntensity: 0.55,
          roughness: 0.2,
        })
      );
      homoCenter.add(coreIon);
      const pocketRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.08, 16, 36),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 })
      );
      pocketRing.rotation.x = Math.PI / 2;
      homoCenter.add(pocketRing);
      homoCenter.visible = false;
      sub.add(homoCenter);

      tagInteractivePart(sub, 'catalyst_active_structure');
    }
  }

  // 2. Approaching Reactant Species ('approaching_reactant_species')
  const appGroup = partMeshes.get('approaching_reactant_species');
  if (appGroup) {
    const sub = getOrCreateStudioAssembly(appGroup, 'cat_approaching_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
      });
      const r1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), mat);
      r1.position.x = -0.22;
      const r2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), mat);
      r2.position.x = 0.22;
      sub.add(r1, r2);
      tagInteractivePart(sub, 'approaching_reactant_species');
    }
  }

  // 3. Adsorbed / Intermediate Complex ('adsorbed_intermediate_species')
  const intGroup = partMeshes.get('adsorbed_intermediate_species');
  if (intGroup) {
    const sub = getOrCreateStudioAssembly(intGroup, 'cat_intermediate_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
      });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), mat);
      c1.position.x = -0.25;
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), mat);
      c2.position.x = 0.25;
      const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), mat);
      bond.rotation.z = Math.PI / 2;
      sub.add(c1, c2, bond);
      tagInteractivePart(sub, 'adsorbed_intermediate_species');
    }
  }

  // 4. Released Product Species ('released_product_species')
  const desGroup = partMeshes.get('released_product_species');
  if (desGroup) {
    const sub = getOrCreateStudioAssembly(desGroup, 'cat_desorbing_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.5,
      });
      const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 18), mat);
      p1.position.x = -0.2;
      const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 18), mat);
      p2.position.x = 0.2;
      sub.add(p1, p2);
      tagInteractivePart(sub, 'released_product_species');
    }
  }

  // 5. Uncatalysed Pathway Profile ('uncatalysed_pathway_curve')
  const uncatArch = partMeshes.get('uncatalysed_pathway_curve');
  if (uncatArch) {
    const sub = getOrCreateStudioAssembly(uncatArch, 'cat_uncat_arch_custom');
    if (sub.children.length === 0) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, -0.6, 0.15),
        new THREE.Vector3(0, 0.85, 0.15),
        new THREE.Vector3(1.5, -0.9, 0.15),
      ]);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.45,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.065, 12, false), mat);
      sub.add(tube);
      tagInteractivePart(sub, 'uncatalysed_pathway_curve');
    }
  }

  // 6. Catalysed Pathway Profile + Comparison Board ('catalysed_pathway_curve')
  const catArch = partMeshes.get('catalysed_pathway_curve');
  if (catArch) {
    const sub = getOrCreateStudioAssembly(catArch, 'cat_catalysed_arch_custom');
    if (sub.children.length === 0) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, 0.2, 0.18),
        new THREE.Vector3(-0.5, 0.65, 0.18),
        new THREE.Vector3(0, 0.35, 0.18),
        new THREE.Vector3(0.5, 0.58, 0.18),
        new THREE.Vector3(1.5, -0.1, 0.18),
      ]);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.6,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.075, 12, false), mat);
      sub.add(tube);

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 2.65, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      frame.position.set(0, 0.15, -0.35);
      sub.add(frame);

      const board = createDynamicCanvasBoard(3.7, 2.5, 768, 520);
      board.mesh.position.set(0, 0.15, -0.28);
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);

      tagInteractivePart(sub, 'catalysed_pathway_curve');
    }
  }
}

// ============================================================================
// MODEL 80: ACID–BASE TITRATION LABORATORY BUILDER
// ============================================================================
function buildAcidBaseTitrationScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Graduated Burette + Dynamic Titrant Column ('graduated_burette')
  const buretteGroup = partMeshes.get('graduated_burette');
  if (buretteGroup) {
    const sub = getOrCreateStudioAssembly(buretteGroup, 'titration_burette_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.32,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 2.7, 28, 1, true),
        glassMat
      );
      sub.add(tube);

      const liqMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.78,
        roughness: 0.2,
      });
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 2.4, 24), liqMat);
      liq.name = 'burette_liquid_column';
      sub.add(liq);

      tagInteractivePart(sub, 'graduated_burette');
    }
  }

  // 2. Titrant Stopcock Valve + Falling Droplet ('titrant_stopcock_valve')
  const valveGroup = partMeshes.get('titrant_stopcock_valve');
  if (valveGroup) {
    const sub = getOrCreateStudioAssembly(valveGroup, 'titration_valve_custom');
    if (sub.children.length === 0) {
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.7,
        roughness: 0.3,
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.36, 20), bodyMat);
      sub.add(body);

      const handleMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.12), handleMat);
      handle.name = 'stopcock_handle';
      sub.add(handle);

      const dropMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
      });
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), dropMat);
      drop.name = 'titrant_droplet';
      drop.position.y = -0.35;
      sub.add(drop);

      tagInteractivePart(sub, 'titrant_stopcock_valve');
    }
  }

  // 3. Receiving Erlenmeyer Flask + Indicator Solution + Stir Bar ('receiving_erlenmeyer_flask')
  const flaskGroup = partMeshes.get('receiving_erlenmeyer_flask');
  if (flaskGroup) {
    const sub = getOrCreateStudioAssembly(flaskGroup, 'titration_flask_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.25,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 1.15, 1.35, 32, 1, true),
        glassMat
      );
      cone.position.y = -0.15;
      sub.add(cone);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.55, 28, 1, true),
        glassMat
      );
      neck.position.y = 0.75;
      sub.add(neck);

      // Indicator solution inside the receiving flask
      const liqMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        transparent: true,
        opacity: 0.78,
        roughness: 0.2,
      });
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.06, 0.66, 32), liqMat);
      liq.position.y = -0.42;
      liq.name = 'indicator_liquid_mesh';
      sub.add(liq);

      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.24, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      plate.position.y = -0.95;
      sub.add(plate);

      const stirBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.45, 14),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
      );
      stirBar.rotation.z = Math.PI / 2;
      stirBar.position.y = -0.72;
      stirBar.name = 'magnetic_stir_bar';
      sub.add(stirBar);

      tagInteractivePart(sub, 'receiving_erlenmeyer_flask');
    }
  }

  // 4. Digital pH Meter & Probe ('digital_ph_readout')
  const phGroup = partMeshes.get('digital_ph_readout');
  if (phGroup) {
    const sub = getOrCreateStudioAssembly(phGroup, 'titration_ph_meter_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 1.05, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(1.45, 0.95, 384, 256);
      board.mesh.position.z = 0.08;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'digital_ph_readout');
    }
  }

  // 5. Titration Curve Graph Board ('titration_curve_graph')
  const curveGroup = partMeshes.get('titration_curve_graph');
  if (curveGroup) {
    const sub = getOrCreateStudioAssembly(curveGroup, 'titration_curve_board_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.95, 2.75, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(3.8, 2.6, 768, 520);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'titration_curve_graph');
    }
  }

  // 6. Equivalence Point Marker ('equivalence_point_marker')
  const eqMarker = partMeshes.get('equivalence_point_marker');
  if (eqMarker) {
    const sub = getOrCreateStudioAssembly(eqMarker, 'titration_eq_marker_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xca8a04,
        emissiveIntensity: 0.7,
      });
      const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), mat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 28), mat);
      sub.add(sp, ring);
      tagInteractivePart(sub, 'equivalence_point_marker');
    }
  }
}

// ============================================================================
// MODEL 81: SOLUBILITY AND PRECIPITATION EXPLORER BUILDER
// ============================================================================
function buildSolubilityPrecipitationScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Aqueous Solution Vessel
  const vesselGroup = partMeshes.get('aqueous_solution_vessel');
  if (vesselGroup) {
    const sub = getOrCreateStudioAssembly(vesselGroup, 'sol_vessel_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.24,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3.0, 36, 1, true),
        glassMat
      );
      sub.add(wall);

      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.16,
        roughness: 0.15,
      });
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 2.5, 32), waterMat);
      water.position.y = -0.15;
      sub.add(water);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.65, 0.22, 36),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      base.position.y = -1.6;
      sub.add(base);

      tagInteractivePart(sub, 'aqueous_solution_vessel');
    }
  }

  // 2. Dissolved Cations
  const catGroup = partMeshes.get('dissolved_cations');
  if (catGroup) {
    const sub = getOrCreateStudioAssembly(catGroup, 'sol_cations_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });
      const geo = new THREE.SphereGeometry(0.13, 16, 16);
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(geo, mat);
        sp.userData.seed = i;
        sub.add(sp);
      }
      tagInteractivePart(sub, 'dissolved_cations');
    }
  }

  // 3. Dissolved Anions
  const anGroup = partMeshes.get('dissolved_anions');
  if (anGroup) {
    const sub = getOrCreateStudioAssembly(anGroup, 'sol_anions_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });
      const geo = new THREE.SphereGeometry(0.14, 16, 16);
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(geo, mat);
        sp.userData.seed = i;
        sub.add(sp);
      }
      tagInteractivePart(sub, 'dissolved_anions');
    }
  }

  // 4. Solid Precipitate Crystals ('solid_precipitate_crystals' — Discrete Micro-Crystals)
  const precipGroup = partMeshes.get('solid_precipitate_crystals');
  if (precipGroup) {
    const sub = getOrCreateStudioAssembly(precipGroup, 'sol_precipitate_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.25,
        metalness: 0.15,
      });
      const crystalGeo = new THREE.BoxGeometry(0.22, 0.16, 0.22);
      for (let i = 0; i < 24; i++) {
        const cr = new THREE.Mesh(crystalGeo, mat);
        const angle = (i / 24) * Math.PI * 2 * 2.3;
        const r = 0.15 + (i % 5) * 0.22;
        cr.position.set(Math.cos(angle) * r, (i % 3) * 0.08, Math.sin(angle) * r);
        cr.rotation.set(i * 0.3, i * 0.5, i * 0.2);
        cr.userData.seed = i;
        sub.add(cr);
      }
      tagInteractivePart(sub, 'solid_precipitate_crystals');
    }
  }

  // 5. Saturation Status Indicator
  const satGroup = partMeshes.get('saturation_status_indicator');
  if (satGroup) {
    const sub = getOrCreateStudioAssembly(satGroup, 'sol_sat_indicator_custom');
    if (sub.children.length === 0) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.32, 0.32),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.45,
        })
      );
      bar.name = 'saturation_status_bar';
      sub.add(bar);
      tagInteractivePart(sub, 'saturation_status_indicator');
    }
  }

  // 6. Solubility Equilibrium Display Board
  const eqBoardGroup = partMeshes.get('solubility_equilibrium_display');
  if (eqBoardGroup) {
    const sub = getOrCreateStudioAssembly(eqBoardGroup, 'sol_eq_board_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.95, 2.65, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(3.8, 2.5, 768, 512);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'solubility_equilibrium_display');
    }
  }
}

// ============================================================================
// MODEL 82: BUFFER SOLUTION SIMULATOR BUILDER
// ============================================================================
function buildBufferSolutionScene(partMeshes: Map<string, THREE.Group>) {
  // 1. Buffer Solution Vessel
  const vesselGroup = partMeshes.get('buffer_solution_vessel');
  if (vesselGroup) {
    const sub = getOrCreateStudioAssembly(vesselGroup, 'buf_vessel_custom');
    if (sub.children.length === 0) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.24,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(1.45, 1.45, 2.9, 36, 1, true),
        glassMat
      );
      sub.add(wall);

      const liqMat = new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.2,
        roughness: 0.15,
      });
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 2.3, 32), liqMat);
      liq.position.y = -0.2;
      sub.add(liq);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.58, 1.62, 0.22, 36),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      base.position.y = -1.55;
      sub.add(base);

      tagInteractivePart(sub, 'buffer_solution_vessel');
    }
  }

  // 2. Weak Acid / Base Species (HA / B)
  const weakGroup = partMeshes.get('weak_acid_base_species');
  if (weakGroup) {
    const sub = getOrCreateStudioAssembly(weakGroup, 'buf_weak_species_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });
      const geo = new THREE.SphereGeometry(0.14, 16, 16);
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(geo, mat);
        sp.userData.seed = i;
        sub.add(sp);
      }
      tagInteractivePart(sub, 'weak_acid_base_species');
    }
  }

  // 3. Conjugate Partner Species (A- / BH+)
  const conjGroup = partMeshes.get('conjugate_partner_species');
  if (conjGroup) {
    const sub = getOrCreateStudioAssembly(conjGroup, 'buf_conj_species_custom');
    if (sub.children.length === 0) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });
      const geo = new THREE.SphereGeometry(0.14, 16, 16);
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(geo, mat);
        sp.userData.seed = i;
        sub.add(sp);
      }
      tagInteractivePart(sub, 'conjugate_partner_species');
    }
  }

  // 4. Acid / Base Addition Droppers
  const dropGroup = partMeshes.get('acid_base_addition_droppers');
  if (dropGroup) {
    const sub = getOrCreateStudioAssembly(dropGroup, 'buf_droppers_custom');
    if (sub.children.length === 0) {
      const acidPipette = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.05, 0.95, 18),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 })
      );
      acidPipette.position.x = -0.38;
      sub.add(acidPipette);

      const basePipette = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.05, 0.95, 18),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
      );
      basePipette.position.x = 0.38;
      sub.add(basePipette);

      tagInteractivePart(sub, 'acid_base_addition_droppers');
    }
  }

  // 5. Buffer Digital pH Readout
  const phGroup = partMeshes.get('buffer_ph_readout');
  if (phGroup) {
    const sub = getOrCreateStudioAssembly(phGroup, 'buf_ph_readout_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 1.0, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(1.55, 0.9, 384, 240);
      board.mesh.position.z = 0.08;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'buffer_ph_readout');
    }
  }

  // 6. Buffer Capacity & Composition Display ('buffer_capacity_composition_display')
  const compGroup = partMeshes.get('buffer_capacity_composition_display');
  if (compGroup) {
    const sub = getOrCreateStudioAssembly(compGroup, 'buf_comp_board_custom');
    if (sub.children.length === 0) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.95, 2.75, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 })
      );
      sub.add(frame);
      const board = createDynamicCanvasBoard(3.8, 2.6, 768, 540);
      board.mesh.position.z = 0.07;
      sub.userData.dynamicBoard = board;
      sub.add(board.mesh);
      tagInteractivePart(sub, 'buffer_capacity_composition_display');
    }
  }
}

// ============================================================================
// REAL-TIME ANIMATION & BOARD UPDATE LOOP
// ============================================================================
export function updateChemistryBatch2CustomAssemblies(
  modelIdOrHandles: string | ChemistryBatch2SceneHandles,
  partMeshesOrParams: Map<string, THREE.Group> | Record<string, any>,
  paramValuesOrElapsed?: Record<string, any> | number,
  clockDelta = 0.016,
  elapsedTime = 0
): void {
  const modelId =
    typeof modelIdOrHandles === 'string' ? modelIdOrHandles : modelIdOrHandles.modelId;
  const partMeshes =
    typeof modelIdOrHandles === 'string'
      ? (partMeshesOrParams as Map<string, THREE.Group>)
      : modelIdOrHandles.partMeshes;
  const paramValues =
    typeof modelIdOrHandles === 'string'
      ? ((paramValuesOrElapsed as Record<string, any>) || {})
      : ((partMeshesOrParams as Record<string, any>) || {});
  const resolvedElapsed =
    typeof modelIdOrHandles === 'string'
      ? elapsedTime
      : typeof paramValuesOrElapsed === 'number'
      ? paramValuesOrElapsed
      : clockDelta;

  if (!isChemistryBatch2Model(modelId, modelId)) return;

  switch (modelId) {
    case 'chemical-kinetics-simulator':
      updateChemicalKineticsScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'chemical-equilibrium-explorer':
      updateChemicalEquilibriumScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'reaction-energy-profile-explorer':
      updateReactionEnergyProfileScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'catalysis-explorer':
      updateCatalysisExplorerScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'acid-base-titration-laboratory':
      updateAcidBaseTitrationScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'solubility-precipitation-explorer':
      updateSolubilityPrecipitationScene(partMeshes, paramValues, resolvedElapsed);
      break;
    case 'buffer-solution-simulator':
      updateBufferSolutionScene(partMeshes, paramValues, resolvedElapsed);
      break;
  }
}

// ----------------------------------------------------------------------------
// 76. UPDATE CHEMICAL KINETICS SIMULATOR
// ----------------------------------------------------------------------------
function updateChemicalKineticsScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateChemicalKineticsMetrics(paramValues);
  const showGraphs = paramValues.showGraphs !== false && paramValues.showGraphs !== 0;

  const thermalSpeed = (0.7 + (m.temperatureC / 100) * 1.4) * m.simulationSpeedMultiplier;
  const totalParticles = 18;
  const prodCount = Math.round((m.conversionFractionPct / 100) * totalParticles);
  const reactCount = Math.max(1, totalParticles - prodCount);

  const reactGroup = partMeshes
    .get('reactant_particles')
    ?.getObjectByName('kinetics_reactants_custom');
  if (reactGroup) {
    let idx = 0;
    reactGroup.children.forEach((ch) => {
      if (ch.name === 'collision_flash_ring') {
        const pulse = (Math.sin(elapsedTime * 5 * thermalSpeed) + 1) * 0.5;
        ch.scale.setScalar(0.6 + pulse * 1.1);
        ch.rotation.y = elapsedTime * 1.5;
        return;
      }
      ch.visible = idx < reactCount;
      const seed = ch.userData.seed ?? idx;
      const angle = seed * 1.1 + elapsedTime * thermalSpeed * (idx % 2 === 0 ? 1.1 : -0.9);
      const r = 0.25 + (seed % 3) * 0.32;
      const yOsc = Math.sin(elapsedTime * 2.2 * thermalSpeed + seed) * 0.85;
      ch.position.set(0.4 + Math.cos(angle) * r, yOsc - 0.3, -0.2 + Math.sin(angle) * r);
      idx++;
    });
  }

  const prodGroup = partMeshes
    .get('product_particles')
    ?.getObjectByName('kinetics_products_custom');
  if (prodGroup) {
    prodGroup.children.forEach((ch, idx) => {
      ch.visible = idx < prodCount;
      const seed = ch.userData.seed ?? idx;
      const angle = seed * 1.3 - elapsedTime * thermalSpeed * 0.95;
      const r = 0.25 + (seed % 3) * 0.3;
      const yOsc = Math.cos(elapsedTime * 2.0 * thermalSpeed + seed) * 0.85;
      ch.position.set(-0.4 + Math.cos(angle) * r, yOsc + 0.3, 0.2 + Math.sin(angle) * r);
    });
  }

  const progFill = partMeshes
    .get('reaction_progress_indicator')
    ?.getObjectByName('progress_fill_bar') as THREE.Mesh | undefined;
  if (progFill) {
    const frac = Math.max(0.05, m.conversionFractionPct / 100);
    progFill.scale.x = frac;
    progFill.position.x = -1.5 * (1 - frac);
  }

  const graphPart = partMeshes.get('concentration_time_graph');
  if (graphPart) {
    graphPart.visible = showGraphs;
    const sub = graphPart.getObjectByName('kinetics_graph_custom');
    const board = sub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    const sig = `${m.reactionModel}_${m.initialConcentrationM}_${m.temperatureC}_${m.catalystActive}_${m.elapsedScientificTimeSec}`;
    if (board && board.lastSignature !== sig) {
      board.lastSignature = sig;
      const { ctx, canvas, texture } = board;
      drawRoundedPanel(ctx, canvas.width, canvas.height, '#38BDF8');

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`CONCENTRATION vs TIME: ${m.balancedEquation.split('[')[0].trim()}`, 26, 42);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        `Rate Law: ${m.rateLawExpression}  |  Integrated: ${m.integratedRateLawExpression}`,
        26,
        72
      );

      const gx = 75,
        gy = 100,
        gw = 650,
        gh = 320;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      const maxC = Math.max(1.2, m.initialConcentrationM * 1.1);
      ctx.beginPath();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 4;
      m.curvePoints.forEach((pt, i) => {
        const px = gx + (pt.timeSec / 100) * gw;
        const py = gy + gh - (pt.reactantConcM / maxC) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      m.curvePoints.forEach((pt, i) => {
        const px = gx + (pt.timeSec / 100) * gw;
        const py = gy + gh - (pt.productConcM / maxC) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const curX = gx + (Math.min(100, m.elapsedScientificTimeSec) / 100) * gw;
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(curX, gy);
      ctx.lineTo(curX, gy + gh);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(`[A]_t = ${m.currentReactantConcM.toFixed(3)} M`, 75, 455);
      ctx.fillStyle = '#10B981';
      ctx.fillText(`[P]_t = ${m.currentProductConcM.toFixed(3)} M`, 290, 455);
      ctx.fillStyle = '#FACC15';
      ctx.fillText(`t = ${m.elapsedScientificTimeSec}s (${m.conversionFractionPct}% conv)`, 500, 455);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '16px sans-serif';
      ctx.fillText(m.orderOriginStatement.slice(0, 92), 26, 490);
      texture.needsUpdate = true;
    }
  }

  const ratePart = partMeshes.get('rate_constant_display');
  if (ratePart) {
    ratePart.visible = showGraphs;
    const sub = ratePart.getObjectByName('kinetics_rate_board_custom');
    const board = sub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    const sig = `${m.reactionModel}_${m.initialConcentrationM}_${m.temperatureC}_${m.catalystActive}_${m.elapsedScientificTimeSec}`;
    if (board && board.lastSignature !== sig) {
      board.lastSignature = sig;
      const { ctx, canvas, texture } = board;
      drawRoundedPanel(ctx, canvas.width, canvas.height, '#F59E0B');

      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(
        `k = ${m.rateConstantK.toFixed(4)} ${m.rateConstantUnits}   |   Half-Life t₁/₂ = ${m.halfLifeSec} s`,
        24,
        46
      );

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '20px sans-serif';
      ctx.fillText(
        `Instantaneous Rate r(t) = ${m.currentReactionRateMS.toFixed(4)} M/s   (Initial r₀ = ${m.initialReactionRateMS.toFixed(4)} M/s)`,
        24,
        92
      );

      ctx.fillStyle = '#38BDF8';
      ctx.font = '19px sans-serif';
      ctx.fillText(
        `Arrhenius: T = ${m.temperatureK} K (${m.temperatureC}°C)  |  Active E_a = ${m.activeActivationEnergyKjMol} kJ/mol (${m.catalystActive ? 'Catalysed' : 'Uncatalysed'})`,
        24,
        136
      );

      ctx.fillStyle = '#94A3B8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Half-Life Formula: ${m.halfLifeFormula}`, 24, 180);
      ctx.fillText(
        `Macroscopic curves follow analytical rate laws; 3D spheres illustrate collisions.`,
        24,
        220
      );

      texture.needsUpdate = true;
    }
  }
}

// ----------------------------------------------------------------------------
// 77. UPDATE CHEMICAL EQUILIBRIUM EXPLORER
// ----------------------------------------------------------------------------
function updateChemicalEquilibriumScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateChemicalEquilibriumMetrics(paramValues);
  const showGraphs =
    paramValues.showEquilibriumGraph !== false && paramValues.showEquilibriumGraph !== 0;

  const piston = partMeshes
    .get('equilibrium_reactor_cylinder')
    ?.getObjectByName('movable_piston');
  if (piston) {
    const normV = (m.vesselVolumeL - 0.5) / 2.0;
    piston.position.y = 0.35 + normV * 1.1;
  }

  const reactCloud = partMeshes
    .get('reactant_species_cloud')
    ?.getObjectByName('eq_reactant_cloud_custom');
  if (reactCloud) {
    const activeCount = Math.max(
      2,
      Math.min(16, Math.round((m.equilibriumReactantAM + m.equilibriumReactantBM) * 7))
    );
    reactCloud.children.forEach((ch, idx) => {
      ch.visible = idx < activeCount;
      const angle = idx * 1.2 + elapsedTime * 1.3;
      const r = 0.25 + (idx % 3) * 0.3;
      ch.position.set(
        0.5 + Math.cos(angle) * r,
        -0.3 + Math.sin(elapsedTime * 1.8 + idx) * 0.65,
        -0.2 + Math.sin(angle) * r
      );
    });
  }

  const prodCloud = partMeshes
    .get('product_species_cloud')
    ?.getObjectByName('eq_product_cloud_custom');
  if (prodCloud) {
    const activeCount = Math.max(2, Math.min(16, Math.round(m.equilibriumProductCM * 9)));
    prodCloud.children.forEach((ch, idx) => {
      ch.visible = idx < activeCount;
      const angle = idx * 1.4 - elapsedTime * 1.35;
      const r = 0.25 + (idx % 3) * 0.3;
      ch.position.set(
        -0.5 + Math.cos(angle) * r,
        0.2 + Math.cos(elapsedTime * 1.9 + idx) * 0.65,
        0.2 + Math.sin(angle) * r
      );
    });
  }

  const fwdSub = partMeshes.get('forward_reaction_indicator')?.getObjectByName('eq_fwd_arrow_custom');
  const revSub = partMeshes.get('reverse_reaction_indicator')?.getObjectByName('eq_rev_arrow_custom');
  const pulse = 1 + Math.sin(elapsedTime * 4) * 0.08;
  const fwdBoost = m.reactionQuotientQc < m.equilibriumConstantKc * 0.97 ? 1.25 : 1.0;
  const revBoost = m.reactionQuotientQc > m.equilibriumConstantKc * 1.03 ? 1.25 : 1.0;
  if (fwdSub) fwdSub.scale.set(1, fwdBoost * pulse, 1);
  if (revSub) revSub.scale.set(1, revBoost * pulse, 1);

  const qPart = partMeshes.get('q_vs_k_equilibrium_display');
  if (qPart) {
    qPart.visible = showGraphs;
    const qSub = qPart.getObjectByName('eq_quotient_board_custom');
    const qBoard = qSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    const sig = `${m.reactionPreset}_${m.initialReactantAM}_${m.initialProductCM}_${m.temperatureC}_${m.vesselVolumeL}_${m.disturbanceMode}_${m.catalystPresent}`;
    if (qBoard && qBoard.lastSignature !== sig) {
      qBoard.lastSignature = sig;
      const { ctx, canvas, texture } = qBoard;
      drawRoundedPanel(ctx, canvas.width, canvas.height, '#10B981');

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(m.balancedEquation, 24, 38);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(
        `Q_c = ${m.reactionQuotientQc}   vs   K_c = ${m.equilibriumConstantKc}   (K_p = ${m.equilibriumConstantKp})`,
        24,
        74
      );

      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Direction: ${m.equilibriumDirection}`, 24, 110);

      // Relaxation graph in middle of board
      const gx = 70,
        gy = 132,
        gw = 650,
        gh = 240;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      const maxC = Math.max(1.5, m.initialReactantAM * 1.2, m.equilibriumProductCM * 1.2);
      ctx.beginPath();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 4;
      m.timePoints.forEach((pt, i) => {
        const px = gx + (pt.timeSec / 60) * gw;
        const py = gy + gh - (pt.reactantAConcM / maxC) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 4;
      m.timePoints.forEach((pt, i) => {
        const px = gx + (pt.timeSec / 60) * gw;
        const py = gy + gh - (pt.productCConcM / maxC) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        `Eq: [A]_eq = ${m.equilibriumReactantAM} M, [C]_eq = ${m.equilibriumProductCM} M  |  r_fwd = r_rev = ${m.forwardRateAtEq} M/s`,
        24,
        412
      );
      ctx.fillText(`Expression: ${m.kcExpression}   |   ${m.kpConversionFormula}`, 24, 446);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '15px sans-serif';
      ctx.fillText(m.leChatelierExplanation.slice(0, 98), 24, 484);
      ctx.fillText(m.catalystExplanation.slice(0, 98), 24, 514);

      texture.needsUpdate = true;
    }
  }
}

// ----------------------------------------------------------------------------
// 78. UPDATE REACTION ENERGY PROFILE EXPLORER
// ----------------------------------------------------------------------------
function updateReactionEnergyProfileScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateReactionEnergyProfileMetrics(paramValues);
  const showGraphs =
    paramValues.showProfileGraph !== false && paramValues.showProfileGraph !== 0;

  const eToY = (eKj: number) => -1.2 + (eKj / 140) * 3.0;
  const yReact = eToY(m.reactantEnergyKjMol);
  const yProd = eToY(m.productEnergyKjMol);
  const yPeak = eToY(m.highestPeakEnergyKjMol);

  const rPlat = partMeshes.get('reactant_region');
  if (rPlat) rPlat.position.set(-3.2, yReact, 0);

  const pPlat = partMeshes.get('product_region');
  if (pPlat) pPlat.position.set(2.2, yProd, 0);

  const tsPart = partMeshes.get('transition_state_indicator');
  if (tsPart) {
    tsPart.position.set(-0.5, yPeak, 0);
    const sub = tsPart.getObjectByName('ep_ts_indicator_custom');
    const traveller = sub?.getObjectByName('coordinate_traveller');
    if (traveller) {
      const xi = m.reactionCoordinateProgress;
      const curXWorld = -3.2 + xi * 5.4;
      const curYWorld = eToY(m.currentCoordinateEnergyKjMol) + 0.32;
      traveller.position.set(curXWorld - -0.5, curYWorld - yPeak, 0.25);

      const atomA = traveller.getObjectByName('atom_a');
      const atomC = traveller.getObjectByName('atom_c');
      if (atomA && atomC) {
        atomA.position.x = -0.22 - xi * 0.35;
        atomC.position.x = 0.55 - xi * 0.33;
      }
    }
  }

  const eaPart = partMeshes.get('activation_energy_marker');
  if (eaPart) {
    const hDiff = Math.max(0.25, yPeak - yReact);
    eaPart.position.set(-1.45, yReact + hDiff * 0.5, 0.45);
    const pillar = eaPart.getObjectByName('ea_pillar');
    if (pillar) pillar.scale.set(1, hDiff, 1);
  }

  const dhPart = partMeshes.get('reaction_enthalpy_marker');
  if (dhPart) {
    const hDiff = Math.max(0.2, Math.abs(yProd - yReact));
    dhPart.position.set(0.85, Math.min(yReact, yProd) + hDiff * 0.5, 0.45);
    const pillar = dhPart.getObjectByName('dh_pillar');
    if (pillar) pillar.scale.set(1, hDiff, 1);
  }

  const pathPart = partMeshes.get('reaction_progress_pathway');
  if (pathPart) {
    const holder = pathPart.getObjectByName('ep_backdrop_board_holder');
    if (holder) {
      holder.visible = showGraphs;
      const board = holder.userData.dynamicBoard as DynamicBoardRef | undefined;
      const sig = `${m.profilePreset}_${m.reactantEnergyKjMol}_${m.productEnergyKjMol}_${m.forwardActivationEnergyKjMol}_${m.reactionCoordinateProgress}_${paramValues.barrierViewMode}`;
      if (board && board.lastSignature !== sig) {
        board.lastSignature = sig;
        const { ctx, canvas, texture } = board;
        drawRoundedPanel(ctx, canvas.width, canvas.height, '#A855F7');

        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(m.profileTitle, 24, 38);

        ctx.fillStyle = m.enthalpyChangeDeltaHKjMol < 0 ? '#34D399' : '#FB923C';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(
          `${m.thermodynamicClassification}   |   ΔH = ${m.enthalpyChangeDeltaHKjMol > 0 ? '+' : ''}${m.enthalpyChangeDeltaHKjMol} kJ/mol`,
          24,
          70
        );

        const gx = 75,
          gy = 92,
          gw = 640,
          gh = 275;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);

        const maxE = Math.max(150, m.highestPeakEnergyKjMol * 1.15);
        ctx.beginPath();
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 5;
        m.curvePoints.forEach((pt, i) => {
          const px = gx + pt.xi * gw;
          const py = gy + gh - (pt.energyKjMol / maxE) * gh;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        const cx = gx + m.reactionCoordinateProgress * gw;
        const cy = gy + gh - (m.currentCoordinateEnergyKjMol / maxE) * gh;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(
          `E_a(fwd) = ${m.forwardActivationEnergyKjMol} kJ/mol   |   E_a(rev) = ${m.reverseActivationEnergyKjMol} kJ/mol`,
          24,
          408
        );

        ctx.fillStyle = '#38BDF8';
        ctx.font = '18px sans-serif';
        ctx.fillText(
          `ξ = ${m.reactionCoordinateProgress.toFixed(2)} (${m.currentCoordinateEnergyKjMol} kJ/mol): ${m.currentRegionLabel}`,
          24,
          446
        );

        ctx.fillStyle = '#94A3B8';
        ctx.font = '16px sans-serif';
        ctx.fillText(m.forwardVsReverseComparison, 24, 484);

        texture.needsUpdate = true;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 79. UPDATE CATALYSIS EXPLORER
// ----------------------------------------------------------------------------
function updateCatalysisExplorerScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateCatalysisMetrics(paramValues);
  const showGraphs =
    paramValues.showEnergyComparison !== false && paramValues.showEnergyComparison !== 0;

  const surfSub = partMeshes.get('catalyst_active_structure')?.getObjectByName('cat_surface_custom');
  if (surfSub) {
    const ptSlab = surfSub.getObjectByName('heterogeneous_pt_slab');
    const homoCenter = surfSub.getObjectByName('homogeneous_cat_center');
    const isHetero = m.catalystPreset === 'heterogeneous_pt_ethene';
    if (ptSlab) ptSlab.visible = isHetero;
    if (homoCenter) {
      homoCenter.visible = !isHetero;
      homoCenter.rotation.y = elapsedTime * 0.8;
    }
  }

  const appGroup = partMeshes.get('approaching_reactant_species');
  const intGroup = partMeshes.get('adsorbed_intermediate_species');
  const desGroup = partMeshes.get('released_product_species');
  if (appGroup) {
    appGroup.position.y = 0.55 + Math.sin(elapsedTime * 2.5) * 0.15;
    appGroup.scale.setScalar(m.reactionStepIndex === 1 ? 1.25 : 0.95);
  }
  if (intGroup) {
    intGroup.position.y = -0.25 + Math.sin(elapsedTime * 3.2) * 0.06;
    intGroup.scale.setScalar(m.reactionStepIndex === 2 || m.reactionStepIndex === 3 ? 1.3 : 0.95);
  }
  if (desGroup) {
    desGroup.position.y = 0.65 + Math.cos(elapsedTime * 2.5) * 0.15;
    desGroup.scale.setScalar(m.reactionStepIndex === 4 ? 1.25 : 0.95);
  }

  const catPart = partMeshes.get('catalysed_pathway_curve');
  if (catPart) {
    const sub = catPart.getObjectByName('cat_catalysed_arch_custom');
    const board = sub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    if (board) {
      board.mesh.visible = showGraphs;
      const sig = `${m.catalystPreset}_${m.pathwayActive}_${m.reactionStepIndex}_${m.catalysedEaKjMol}_${m.temperatureK}`;
      if (board.lastSignature !== sig) {
        board.lastSignature = sig;
        const { ctx, canvas, texture } = board;
        drawRoundedPanel(ctx, canvas.width, canvas.height, '#10B981');

        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(m.catalystTitle, 24, 38);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '18px sans-serif';
        ctx.fillText(`${m.overallReactionEquation}   |   ${m.catalysisCategory}`, 24, 70);

        const gx = 70,
          gy = 92,
          gw = 640,
          gh = 220;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);

        ctx.beginPath();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = m.pathwayActive === 'uncatalysed' ? 5 : 3;
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const base = 0.35 + (0.72 - 0.35) * u;
          const arch = Math.sin(Math.PI * u) ** 2 * 0.52;
          const px = gx + u * gw;
          const py = gy + gh * (base - arch);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = m.pathwayActive === 'catalysed' ? 5 : 3;
        const redFrac = m.catalysedEaKjMol / m.uncatalysedEaKjMol;
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const base = 0.35 + (0.72 - 0.35) * u;
          const doubleHump =
            Math.sin(Math.PI * u) * (0.22 + 0.14 * Math.sin(3 * Math.PI * u)) * redFrac;
          const px = gx + u * gw;
          const py = gy + gh * (base - doubleHump);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(`Uncatalysed E_a = ${m.uncatalysedEaKjMol} kJ/mol`, 24, 346);
        ctx.fillStyle = '#10B981';
        ctx.fillText(
          `Catalysed E_a,cat = ${m.catalysedEaKjMol} kJ/mol  (ΔE_a = −${m.activationEnergyReductionKjMol} kJ/mol)`,
          320,
          346
        );

        ctx.fillStyle = '#FACC15';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(
          `Arrhenius Factor k_cat/k_uncat = e^(ΔE_a/RT) = ${m.arrheniusRateEnhancementFactor.toExponential(2)}× at ${m.temperatureK} K`,
          24,
          384
        );

        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(m.reactionStepTitle, 24, 422);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '16px sans-serif';
        ctx.fillText(m.reactionStepDescription.slice(0, 96), 24, 452);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(
          `K_eq Invariant: Catalyst lowers forward & reverse barriers equally; ΔH° = ${m.overallDeltaHKjMol} kJ/mol unchanged.`,
          24,
          488
        );

        texture.needsUpdate = true;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 80. UPDATE ACID–BASE TITRATION LABORATORY
// ----------------------------------------------------------------------------
function updateAcidBaseTitrationScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateTitrationMetrics(paramValues);
  const showCurve =
    paramValues.showTitrationCurve !== false && paramValues.showTitrationCurve !== 0;

  const buretteLiq = partMeshes
    .get('graduated_burette')
    ?.getObjectByName('burette_liquid_column') as THREE.Mesh | undefined;
  if (buretteLiq) {
    const remFrac = Math.max(0.06, 1 - m.titrantVolumeAddedMl / 52);
    buretteLiq.scale.y = remFrac;
    buretteLiq.position.y = -1.2 * (1 - remFrac);
  }

  const droplet = partMeshes.get('titrant_stopcock_valve')?.getObjectByName('titrant_droplet');
  if (droplet) {
    const dropPhase = (elapsedTime * 2.2) % 1;
    droplet.position.y = -0.15 - dropPhase * 0.75;
  }

  const flaskSub = partMeshes.get('receiving_erlenmeyer_flask')?.getObjectByName('titration_flask_custom');
  if (flaskSub) {
    const stirBar = flaskSub.getObjectByName('magnetic_stir_bar');
    if (stirBar) stirBar.rotation.y = elapsedTime * 10;

    const indMesh = flaskSub.getObjectByName('indicator_liquid_mesh') as THREE.Mesh | undefined;
    if (indMesh) {
      const mat = indMesh.material as THREE.MeshStandardMaterial;
      mat.color.set(m.indicatorHexColor);
      const volScale = 0.85 + ((m.analyteVolumeMl + m.titrantVolumeAddedMl) / 90) * 0.45;
      indMesh.scale.y = volScale;
    }
  }

  const phSub = partMeshes.get('digital_ph_readout')?.getObjectByName('titration_ph_meter_custom');
  const phBoard = phSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
  const sig = `${m.titrationType}_${m.titrantVolumeAddedMl}_${m.analyteConcentrationM}_${m.titrantConcentrationM}_${m.analyteVolumeMl}_${m.indicatorType}`;
  if (phBoard && phBoard.lastSignature !== sig) {
    phBoard.lastSignature = sig;
    const { ctx, canvas, texture } = phBoard;
    drawRoundedPanel(ctx, canvas.width, canvas.height, '#10B981');
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('DIGITAL pH METER', 22, 42);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 58px monospace';
    ctx.fillText(`pH ${m.currentPh.toFixed(2)}`, 22, 118);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '20px sans-serif';
    ctx.fillText(`V_added = ${m.titrantVolumeAddedMl.toFixed(1)} mL`, 22, 168);
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`V_eq = ${m.equivalenceVolumeMl.toFixed(1)} mL (pH ${m.equivalencePointPh})`, 22, 208);
    texture.needsUpdate = true;
  }

  const curvePart = partMeshes.get('titration_curve_graph');
  if (curvePart) {
    curvePart.visible = showCurve;
    const curveSub = curvePart.getObjectByName('titration_curve_board_custom');
    const curveBoard = curveSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    if (curveBoard && curveBoard.lastSignature !== sig) {
      curveBoard.lastSignature = sig;
      const { ctx, canvas, texture } = curveBoard;
      drawRoundedPanel(ctx, canvas.width, canvas.height, '#38BDF8');

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(`TITRATION CURVE: ${m.balancedEquation}`, 24, 38);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`${m.pKaOrPKbNote}`, 24, 68);

      const gx = 70,
        gy = 90,
        gw = 650,
        gh = 265;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      const eqX = gx + (Math.min(50, m.equivalenceVolumeMl) / 50) * gw;
      ctx.strokeStyle = '#FACC15';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, gy);
      ctx.lineTo(eqX, gy + gh);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      m.curvePoints.forEach((pt, i) => {
        const px = gx + (pt.titrantVolumeMl / 50) * gw;
        const py = gy + gh - (Math.min(14, Math.max(0, pt.pH)) / 14) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const curX = gx + (m.titrantVolumeAddedMl / 50) * gw;
      const curY = gy + gh - (Math.min(14, Math.max(0, m.currentPh)) / 14) * gh;
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(curX, curY, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Region: ${m.titrationRegionLabel}`, 24, 392);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '17px sans-serif';
      ctx.fillText(`Method: ${m.activeCalculationMethod.slice(0, 92)}`, 24, 428);

      ctx.fillStyle = m.indicatorHexColor;
      ctx.fillText(
        `Indicator: ${m.indicatorName} (${m.indicatorTransitionRange}) — ${m.indicatorColorDescription}`,
        24,
        464
      );
      ctx.fillStyle = '#94A3B8';
      ctx.font = '15px sans-serif';
      ctx.fillText(m.indicatorSuitabilityNote.slice(0, 100), 24, 496);

      texture.needsUpdate = true;
    }
  }
}

// ----------------------------------------------------------------------------
// 81. UPDATE SOLUBILITY AND PRECIPITATION EXPLORER
// ----------------------------------------------------------------------------
function updateSolubilityPrecipitationScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateSolubilityPrecipitationMetrics(paramValues);
  const showIons = paramValues.showDissolvedIons !== false && paramValues.showDissolvedIons !== 0;
  const showBoard =
    paramValues.showEquilibriumBoard !== false && paramValues.showEquilibriumBoard !== 0;

  const catPart = partMeshes.get('dissolved_cations');
  if (catPart) {
    catPart.visible = showIons;
    const sub = catPart.getObjectByName('sol_cations_custom');
    sub?.children.forEach((ch, idx) => {
      const angle = idx * 1.3 + elapsedTime * 1.1;
      const r = 0.25 + (idx % 3) * 0.3;
      ch.position.set(
        0.45 + Math.cos(angle) * r,
        -0.3 + Math.sin(elapsedTime * 1.5 + idx) * 0.65,
        -0.2 + Math.sin(angle) * r
      );
    });
  }

  const anPart = partMeshes.get('dissolved_anions');
  if (anPart) {
    anPart.visible = showIons;
    const sub = anPart.getObjectByName('sol_anions_custom');
    sub?.children.forEach((ch, idx) => {
      const angle = idx * 1.2 - elapsedTime * 1.15;
      const r = 0.25 + (idx % 3) * 0.3;
      ch.position.set(
        -0.45 + Math.cos(angle) * r,
        -0.2 + Math.cos(elapsedTime * 1.6 + idx) * 0.65,
        0.2 + Math.sin(angle) * r
      );
    });
  }

  const precipSub = partMeshes
    .get('solid_precipitate_crystals')
    ?.getObjectByName('sol_precipitate_custom');
  if (precipSub) {
    const isPrecip = m.precipitateFormedMillimoles > 0;
    const activeCrystals = isPrecip
      ? Math.max(4, Math.min(24, Math.round(m.precipitateMassMg * 1.5)))
      : 0;
    precipSub.children.forEach((ch, idx) => {
      ch.visible = idx < activeCrystals;
      const mesh = ch as THREE.Mesh;
      (mesh.material as THREE.MeshStandardMaterial).color.set(m.precipitateColorHex);
    });
  }

  const satBar = partMeshes
    .get('saturation_status_indicator')
    ?.getObjectByName('saturation_status_bar') as THREE.Mesh | undefined;
  if (satBar) {
    const mat = satBar.material as THREE.MeshStandardMaterial;
    if (m.ionProductQsp > m.kspValue25C * 1.02) {
      mat.color.set('#F59E0B');
      mat.emissive.set('#B45309');
    } else {
      mat.color.set('#10B981');
      mat.emissive.set('#059669');
    }
  }

  const eqPart = partMeshes.get('solubility_equilibrium_display');
  if (eqPart) {
    eqPart.visible = showBoard;
    const eqSub = eqPart.getObjectByName('sol_eq_board_custom');
    const eqBoard = eqSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
    const sig = `${m.saltPreset}_${m.cationAddedMillimolar}_${m.anionAddedMillimolar}_${m.solutionVolumeMl}_${m.commonIonAddedMillimolar}`;
    if (eqBoard && eqBoard.lastSignature !== sig) {
      eqBoard.lastSignature = sig;
      const { ctx, canvas, texture } = eqBoard;
      drawRoundedPanel(ctx, canvas.width, canvas.height, '#FACC15');

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 23px sans-serif';
      ctx.fillText(`${m.saltName}: ${m.dissolutionEquation}`, 24, 42);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(
        `${m.kspExpression}   |   K_sp(25°C) = ${m.kspValue25C.toExponential(2)}  (pK_sp = ${m.pKsp})`,
        24,
        80
      );

      ctx.fillStyle = m.ionProductQsp > m.kspValue25C ? '#FACC15' : '#10B981';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(
        `Ion Product Q_sp = ${m.ionProductQsp.toExponential(2)}   (Q_sp / K_sp = ${m.saturationRatioQspOverKsp})`,
        24,
        122
      );

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(`Regime: ${m.saturationStatus}`, 24, 162);

      const logQ = Math.max(-16, Math.min(-2, Math.log10(Math.max(1e-16, m.ionProductQsp))));
      const logK = Math.max(-16, Math.min(-2, Math.log10(m.kspValue25C)));
      const qBarW = ((logQ + 16) / 14) * 520;
      const kBarW = ((logK + 16) / 14) * 520;

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(190, 185, 520, 26);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(190, 185, Math.max(12, qBarW), 26);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '17px sans-serif';
      ctx.fillText(`log₁₀(Q_sp) = ${logQ.toFixed(2)}`, 24, 204);

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(190, 224, 520, 26);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(190, 224, Math.max(12, kBarW), 26);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(`log₁₀(K_sp) = ${logK.toFixed(2)}`, 24, 243);

      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(
        `Precipitated Solid: ${m.precipitateMassMg} mg (${m.precipitateFormedMillimoles} mmol) — ${m.precipitateAppearanceLabel}`,
        24,
        292
      );

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        `Equilibrium Dissolved Ions: [${m.cationFormula}]_eq = ${m.equilibriumCationConcM.toExponential(2)} M,  [${m.anionFormula}]_eq = ${m.equilibriumAnionConcM.toExponential(2)} M`,
        24,
        334
      );

      ctx.fillStyle = '#94A3B8';
      ctx.font = '15px sans-serif';
      ctx.fillText(m.commonIonEffectExplanation.slice(0, 98), 24, 376);
      ctx.fillText(m.kineticNucleationDisclaimer.slice(0, 98), 24, 408);

      texture.needsUpdate = true;
    }
  }
}

// ----------------------------------------------------------------------------
// 82. UPDATE BUFFER SOLUTION SIMULATOR
// ----------------------------------------------------------------------------
function updateBufferSolutionScene(
  partMeshes: Map<string, THREE.Group>,
  paramValues: Record<string, any>,
  elapsedTime: number
) {
  const m = calculateBufferSolutionMetrics(paramValues);
  const showCap =
    paramValues.showCapacityComparison !== false && paramValues.showCapacityComparison !== 0;

  const weakSub = partMeshes
    .get('weak_acid_base_species')
    ?.getObjectByName('buf_weak_species_custom');
  if (weakSub) {
    const count = Math.max(1, Math.min(14, Math.round((m.remainingWeakMmol / 45) * 14)));
    weakSub.children.forEach((ch, idx) => {
      ch.visible = idx < count;
      const angle = idx * 1.2 + elapsedTime * 1.0;
      const r = 0.25 + (idx % 3) * 0.28;
      ch.position.set(
        0.45 + Math.cos(angle) * r,
        -0.2 + Math.sin(elapsedTime * 1.4 + idx) * 0.6,
        -0.2 + Math.sin(angle) * r
      );
    });
  }

  const conjSub = partMeshes
    .get('conjugate_partner_species')
    ?.getObjectByName('buf_conj_species_custom');
  if (conjSub) {
    const count = Math.max(1, Math.min(14, Math.round((m.remainingConjugateMmol / 45) * 14)));
    conjSub.children.forEach((ch, idx) => {
      ch.visible = idx < count;
      const angle = idx * 1.3 - elapsedTime * 1.05;
      const r = 0.25 + (idx % 3) * 0.28;
      ch.position.set(
        -0.45 + Math.cos(angle) * r,
        -0.2 + Math.cos(elapsedTime * 1.5 + idx) * 0.6,
        0.2 + Math.sin(angle) * r
      );
    });
  }

  const phSub = partMeshes.get('buffer_ph_readout')?.getObjectByName('buf_ph_readout_custom');
  const phBoard = phSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
  const sig = `${m.bufferPreset}_${m.initialWeakConcM}_${m.initialConjugateConcM}_${m.addedStrongAcidMmol}_${m.addedStrongBaseMmol}_${showCap}`;
  if (phBoard && phBoard.lastSignature !== sig) {
    phBoard.lastSignature = sig;
    const { ctx, canvas, texture } = phBoard;
    drawRoundedPanel(
      ctx,
      canvas.width,
      canvas.height,
      m.bufferCapacityExceeded ? '#EF4444' : '#10B981'
    );

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`pK_a = ${m.pKaValue} | Initial pH ${m.initialPh}`, 18, 36);

    ctx.fillStyle = m.bufferCapacityExceeded ? '#EF4444' : '#10B981';
    ctx.font = 'bold 54px monospace';
    ctx.fillText(`pH ${m.finalPh.toFixed(2)}`, 18, 108);

    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(
      `ΔpH = ${m.deltaPh >= 0 ? '+' : ''}${m.deltaPh.toFixed(2)} ${m.bufferCapacityExceeded ? '(LIMIT!)' : '(Buffered)'}`,
      18,
      155
    );

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Useful Range: ${m.usefulBufferRangePh}`, 18, 198);
    texture.needsUpdate = true;
  }

  const compSub = partMeshes
    .get('buffer_capacity_composition_display')
    ?.getObjectByName('buf_comp_board_custom');
  const compBoard = compSub?.userData.dynamicBoard as DynamicBoardRef | undefined;
  if (compBoard && compBoard.lastSignature !== sig) {
    compBoard.lastSignature = sig;
    const { ctx, canvas, texture } = compBoard;
    drawRoundedPanel(ctx, canvas.width, canvas.height, '#38BDF8');

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${m.bufferTitle}`, 24, 38);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px sans-serif';
    ctx.fillText(m.equilibriumEquation, 24, 68);

    const maxMmol = Math.max(40, m.remainingWeakMmol + m.remainingConjugateMmol);
    const wBar = (m.remainingWeakMmol / maxMmol) * 420;
    const cBar = (m.remainingConjugateMmol / maxMmol) * 420;

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(
      `${m.weakComponentFormula}: ${m.remainingWeakMmol} mmol (${m.remainingWeakConcM} M)`,
      24,
      110
    );
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(320, 90, 410, 24);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(320, 90, Math.max(8, wBar), 24);

    ctx.fillStyle = '#10B981';
    ctx.fillText(
      `${m.conjugatePartnerFormula}: ${m.remainingConjugateMmol} mmol (${m.remainingConjugateConcM} M)`,
      24,
      150
    );
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(320, 130, 410, 24);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(320, 130, Math.max(8, cBar), 24);

    ctx.fillStyle = '#FACC15';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Method: ${m.calculationMethodLabel}`, 24, 192);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '16px sans-serif';
    ctx.fillText(m.neutralizationMechanismText.slice(0, 98), 24, 224);

    if (showCap) {
      ctx.fillStyle = '#A855F7';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText('BUFFER CAPACITY COMPARISON (SAME ACID/BASE ADDITION):', 24, 266);

      const rows = [
        {
          label: `1. Active Buffer (${(m.initialWeakConcM + m.initialConjugateConcM).toFixed(2)} M total)`,
          pH: m.finalPh,
          delta: `ΔpH = ${m.deltaPh >= 0 ? '+' : ''}${m.deltaPh.toFixed(2)}`,
          color: '#10B981',
        },
        {
          label: `2. Dilute 0.25× Reference Buffer`,
          pH: m.diluteReferenceBufferFinalPh,
          delta: `ΔpH = ${m.diluteReferenceDeltaPh >= 0 ? '+' : ''}${m.diluteReferenceDeltaPh.toFixed(2)}`,
          color: '#F59E0B',
        },
        {
          label: `3. Unbuffered Pure Water`,
          pH: m.unbufferedWaterPh,
          delta: `pH 7.00 → ${m.unbufferedWaterPh.toFixed(2)}`,
          color: '#EF4444',
        },
      ];

      rows.forEach((r, idx) => {
        const y = 304 + idx * 66;
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`${r.label}:  pH ${r.pH.toFixed(2)}  (${r.delta})`, 24, y);

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(24, y + 10, 710, 20);
        ctx.fillStyle = r.color;
        ctx.fillRect(24, y + 10, (Math.min(14, Math.max(0.5, r.pH)) / 14) * 710, 20);
      });
    }

    texture.needsUpdate = true;
  }
}
