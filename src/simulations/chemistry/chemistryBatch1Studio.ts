import * as THREE from 'three';
import {
  calculateMolecularOrbitalMetrics,
  calculateAtomicOrbitalMetrics,
  calculateCrystalLatticeMetrics,
  calculateMolecularPolarityMetrics,
  calculateIntermolecularForcesMetrics,
  calculateGalvanicCellMetrics,
  calculateElectrolysisMetrics,
} from './chemistryBatch1Engine';

type CreateMatFn = (
  color: string | number,
  opacity?: number,
  metalness?: number,
  roughness?: number,
  emissive?: string | number,
  emissiveIntensity?: number
) => THREE.MeshStandardMaterial;

type MakeGlowFn = (color: string | number, radius?: number, intensity?: number) => THREE.Sprite;

type RegisterPartFn = (
  obj: THREE.Object3D,
  id: string,
  name: string,
  baseY?: number,
  basePos?: [number, number, number],
  baseScale?: [number, number, number],
  baseRot?: [number, number, number]
) => void;

/**
 * Helper to create or update a crisp 2D canvas texture on a 3D readout plane.
 * Caches by signature string so texture uploads only occur when state changes.
 */
function createOrUpdateReadoutSprite(
  parent: THREE.Object3D,
  keyName: string,
  signature: string,
  lines: { text: string; color?: string; font?: string }[],
  width = 512,
  height = 256,
  scale: [number, number, number] = [3.8, 1.9, 1]
): THREE.Sprite {
  let sprite = parent.getObjectByName(keyName) as THREE.Sprite | undefined;
  if (typeof document === 'undefined') {
    if (!sprite) {
      sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0.85 }));
      sprite.name = keyName;
      sprite.scale.set(scale[0], scale[1], scale[2]);
      parent.add(sprite);
    }
    return sprite;
  }

  if (!sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    sprite = new THREE.Sprite(mat);
    sprite.name = keyName;
    sprite.scale.set(scale[0], scale[1], scale[2]);
    sprite.renderOrder = 25;
    parent.add(sprite);
  }

  if (sprite.userData.lastSignature !== signature) {
    sprite.userData.lastSignature = signature;
    const mat = sprite.material as THREE.SpriteMaterial;
    const tex = mat.map as THREE.CanvasTexture;
    if (tex && tex.image) {
      const canvas = tex.image as HTMLCanvasElement;
      const ctx = canvas.getContext ? canvas.getContext('2d') : null;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 16);
        ctx.fill();
        ctx.stroke();

        let y = 38;
        const lineSpacing = Math.min(36, Math.floor((canvas.height - 32) / Math.max(1, lines.length)));
        for (const item of lines) {
          ctx.font = item.font || 'bold 21px Inter, system-ui, sans-serif';
          ctx.fillStyle = item.color || '#F8FAFC';
          ctx.fillText(item.text, 22, y);
          y += lineSpacing;
        }
        tex.needsUpdate = true;
      }
    }
  }

  return sprite;
}

/**
 * Helper to create a compact floating badge sprite (+, −, δ⁺, δ⁻, K⁺, NO₃⁻, etc.)
 */
function createBadgeSprite(text: string, bgColor: string, textColor = '#FFFFFF', scale = 0.55): THREE.Sprite {
  if (typeof document === 'undefined') {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: new THREE.Color(bgColor as any), transparent: true }));
    sprite.scale.set(scale * 1.6, scale * 0.8, 1);
    return sprite;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 144, 64, 24);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 80, 42);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * 1.6, scale * 0.8, 1);
  return sprite;
}

/**
 * Builds the 3D scene for Chemistry Batch 1 Models (Models 69–75)
 */
export function buildChemistryBatch1Studio(
  modelId: string,
  modelGroup: THREE.Group,
  _clickableMeshes: THREE.Object3D[],
  createMat: CreateMatFn,
  makeGlow: MakeGlowFn,
  registerPart: RegisterPartFn
): boolean {
  // ============================================================================
  // MODEL 69: MOLECULAR ORBITAL EXPLORER
  // ============================================================================
  if (modelId === 'molecular-orbital-explorer') {
    // 1. Molecular Axis (z-axis oriented along x in world space)
    const axisGroup = new THREE.Group();
    const axisRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 8.2, 20),
      createMat('#94A3B8', 0.85, 0.5, 0.3)
    );
    axisRod.rotation.z = Math.PI / 2;
    axisGroup.add(axisRod);
    const internuclearZone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 2.6, 24, 1, true),
      createMat('#38BDF8', 0.2, 0.1, 0.3)
    );
    internuclearZone.rotation.z = Math.PI / 2;
    internuclearZone.name = 'internuclear_cylinder';
    axisGroup.add(internuclearZone);
    registerPart(axisGroup, 'molecular_axis', 'Molecular Axis', 0, [0, 0, 0]);
    modelGroup.add(axisGroup);

    // 2. Nucleus A & Nucleus B
    const nucAGroup = new THREE.Group();
    const nucAMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      createMat('#F59E0B', 1.0, 0.4, 0.2, '#D97706', 0.35)
    );
    nucAGroup.add(nucAMesh);
    nucAGroup.add(makeGlow('#F59E0B', 0.85, 0.45));
    const badgeA = createBadgeSprite('Nucleus A (+Z)', 'rgba(180, 83, 9, 0.9)', '#FEF3C7', 0.5);
    badgeA.position.set(0, -0.58, 0);
    nucAGroup.add(badgeA);
    nucAGroup.position.set(-1.4, 0, 0);
    registerPart(nucAGroup, 'nucleus_a', 'Nucleus A', 0, [-1.4, 0, 0]);
    modelGroup.add(nucAGroup);

    const nucBGroup = new THREE.Group();
    const nucBMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      createMat('#F59E0B', 1.0, 0.4, 0.2, '#D97706', 0.35)
    );
    nucBGroup.add(nucBMesh);
    nucBGroup.add(makeGlow('#F59E0B', 0.85, 0.45));
    const badgeB = createBadgeSprite('Nucleus B (+Z)', 'rgba(180, 83, 9, 0.9)', '#FEF3C7', 0.5);
    badgeB.position.set(0, -0.58, 0);
    nucBGroup.add(badgeB);
    nucBGroup.position.set(1.4, 0, 0);
    registerPart(nucBGroup, 'nucleus_b', 'Nucleus B', 0, [1.4, 0, 0]);
    modelGroup.add(nucBGroup);

    // 3. Atomic Orbital A & Atomic Orbital B (before/during combination)
    const aoAGroup = new THREE.Group();
    const aoAPosLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      createMat('#38BDF8', 0.38, 0.05, 0.2, '#0284C7', 0.15)
    );
    aoAPosLobe.name = 'ao_a_pos_lobe';
    aoAGroup.add(aoAPosLobe);
    const aoANegLobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 28, 28),
      createMat('#F43F5E', 0.38, 0.05, 0.2, '#E11D48', 0.15)
    );
    aoANegLobe.name = 'ao_a_neg_lobe';
    aoANegLobe.visible = false;
    aoAGroup.add(aoANegLobe);
    const aoPhaseBadgeA = createBadgeSprite('+ψ_A', 'rgba(2, 132, 199, 0.88)', '#E0F2FE', 0.42);
    aoPhaseBadgeA.position.set(0, 1.35, 0);
    aoPhaseBadgeA.name = 'ao_a_phase_badge';
    aoAGroup.add(aoPhaseBadgeA);
    aoAGroup.position.set(-1.8, 0, 0);
    registerPart(aoAGroup, 'ao_a', 'Atomic Orbital A', 0, [-1.8, 0, 0]);
    modelGroup.add(aoAGroup);

    const aoBGroup = new THREE.Group();
    const aoBPosLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      createMat('#38BDF8', 0.38, 0.05, 0.2, '#0284C7', 0.15)
    );
    aoBPosLobe.name = 'ao_b_pos_lobe';
    aoBGroup.add(aoBPosLobe);
    const aoBNegLobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 28, 28),
      createMat('#F43F5E', 0.38, 0.05, 0.2, '#E11D48', 0.15)
    );
    aoBNegLobe.name = 'ao_b_neg_lobe';
    aoBNegLobe.visible = false;
    aoBGroup.add(aoBNegLobe);
    const aoPhaseBadgeB = createBadgeSprite('+ψ_B', 'rgba(2, 132, 199, 0.88)', '#E0F2FE', 0.42);
    aoPhaseBadgeB.position.set(0, 1.35, 0);
    aoPhaseBadgeB.name = 'ao_b_phase_badge';
    aoBGroup.add(aoPhaseBadgeB);
    aoBGroup.position.set(1.8, 0, 0);
    registerPart(aoBGroup, 'ao_b', 'Atomic Orbital B', 0, [1.8, 0, 0]);
    modelGroup.add(aoBGroup);

    // 4. Bonding Molecular Orbital (σ_1s, σ_2p, or π_2p)
    const moBondGroup = new THREE.Group();
    // Sigma central prolate ellipsoid
    const sigmaBondEllipsoid = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 36, 36),
      createMat('#0EA5E9', 0.46, 0.08, 0.18, '#0284C7', 0.2)
    );
    sigmaBondEllipsoid.scale.set(1.85, 1.05, 1.05);
    sigmaBondEllipsoid.name = 'sigma_bond_center';
    moBondGroup.add(sigmaBondEllipsoid);

    // Outer negative lobes for sigma_2p bonding
    const sigma2pLeftOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 28, 28),
      createMat('#F43F5E', 0.42, 0.08, 0.18, '#E11D48', 0.15)
    );
    sigma2pLeftOuter.position.set(-2.35, 0, 0);
    sigma2pLeftOuter.scale.set(0.95, 0.78, 0.78);
    sigma2pLeftOuter.name = 'sigma2p_outer_left';
    sigma2pLeftOuter.visible = false;
    moBondGroup.add(sigma2pLeftOuter);

    const sigma2pRightOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 28, 28),
      createMat('#F43F5E', 0.42, 0.08, 0.18, '#E11D48', 0.15)
    );
    sigma2pRightOuter.position.set(2.35, 0, 0);
    sigma2pRightOuter.scale.set(0.95, 0.78, 0.78);
    sigma2pRightOuter.name = 'sigma2p_outer_right';
    sigma2pRightOuter.visible = false;
    moBondGroup.add(sigma2pRightOuter);

    // Pi bonding upper (+) and lower (−) banana lobes
    const piUpperLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 32, 32),
      createMat('#0EA5E9', 0.46, 0.08, 0.18, '#0284C7', 0.2)
    );
    piUpperLobe.position.set(0, 1.05, 0);
    piUpperLobe.scale.set(1.85, 0.72, 0.82);
    piUpperLobe.name = 'pi_bond_upper';
    piUpperLobe.visible = false;
    moBondGroup.add(piUpperLobe);

    const piLowerLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 32, 32),
      createMat('#F43F5E', 0.46, 0.08, 0.18, '#E11D48', 0.2)
    );
    piLowerLobe.position.set(0, -1.05, 0);
    piLowerLobe.scale.set(1.85, 0.72, 0.82);
    piLowerLobe.name = 'pi_bond_lower';
    piLowerLobe.visible = false;
    moBondGroup.add(piLowerLobe);

    const bondPhasePlus = createBadgeSprite('+ψ (Constructive)', 'rgba(2, 132, 199, 0.92)', '#F0F9FF', 0.46);
    bondPhasePlus.position.set(0, 1.55, 0);
    bondPhasePlus.name = 'bond_phase_plus';
    moBondGroup.add(bondPhasePlus);

    registerPart(moBondGroup, 'mo_bonding', 'Bonding Molecular Orbital', 0, [0, 0, 0]);
    modelGroup.add(moBondGroup);

    // 5. Antibonding Molecular Orbital (σ*_1s, σ*_2p, or π*_2p)
    const moAntiGroup = new THREE.Group();
    const antiLeftLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      createMat('#0EA5E9', 0.45, 0.08, 0.18, '#0284C7', 0.18)
    );
    antiLeftLobe.position.set(-2.05, 0, 0);
    antiLeftLobe.scale.set(1.15, 0.95, 0.95);
    antiLeftLobe.name = 'anti_left_lobe';
    moAntiGroup.add(antiLeftLobe);

    const antiRightLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      createMat('#F43F5E', 0.45, 0.08, 0.18, '#E11D48', 0.18)
    );
    antiRightLobe.position.set(2.05, 0, 0);
    antiRightLobe.scale.set(1.15, 0.95, 0.95);
    antiRightLobe.name = 'anti_right_lobe';
    moAntiGroup.add(antiRightLobe);

    // Four-lobe pi* antibonding arrangement
    const piStarTL = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 28, 28),
      createMat('#0EA5E9', 0.45, 0.08, 0.18, '#0284C7', 0.18)
    );
    piStarTL.position.set(-1.6, 1.05, 0);
    piStarTL.scale.set(1.1, 0.78, 0.78);
    piStarTL.name = 'pi_star_tl';
    piStarTL.visible = false;
    moAntiGroup.add(piStarTL);

    const piStarBL = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 28, 28),
      createMat('#F43F5E', 0.45, 0.08, 0.18, '#E11D48', 0.18)
    );
    piStarBL.position.set(-1.6, -1.05, 0);
    piStarBL.scale.set(1.1, 0.78, 0.78);
    piStarBL.name = 'pi_star_bl';
    piStarBL.visible = false;
    moAntiGroup.add(piStarBL);

    const piStarTR = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 28, 28),
      createMat('#F43F5E', 0.45, 0.08, 0.18, '#E11D48', 0.18)
    );
    piStarTR.position.set(1.6, 1.05, 0);
    piStarTR.scale.set(1.1, 0.78, 0.78);
    piStarTR.name = 'pi_star_tr';
    piStarTR.visible = false;
    moAntiGroup.add(piStarTR);

    const piStarBR = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 28, 28),
      createMat('#0EA5E9', 0.45, 0.08, 0.18, '#0284C7', 0.18)
    );
    piStarBR.position.set(1.6, -1.05, 0);
    piStarBR.scale.set(1.1, 0.78, 0.78);
    piStarBR.name = 'pi_star_br';
    piStarBR.visible = false;
    moAntiGroup.add(piStarBR);

    const antiBadgeL = createBadgeSprite('+ψ', 'rgba(2, 132, 199, 0.92)', '#F0F9FF', 0.42);
    antiBadgeL.position.set(-2.1, 1.45, 0);
    antiBadgeL.name = 'anti_badge_l';
    moAntiGroup.add(antiBadgeL);

    const antiBadgeR = createBadgeSprite('−ψ (Out-of-Phase)', 'rgba(225, 29, 72, 0.92)', '#FFE4E6', 0.42);
    antiBadgeR.position.set(2.1, 1.45, 0);
    antiBadgeR.name = 'anti_badge_r';
    moAntiGroup.add(antiBadgeR);

    moAntiGroup.visible = false;
    registerPart(moAntiGroup, 'mo_antibonding', 'Antibonding Molecular Orbital', 0, [0, 0, 0]);
    modelGroup.add(moAntiGroup);

    // 6. Nodal Surface
    const nodalGroup = new THREE.Group();
    const transverseNode = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 3.6, 3.6),
      createMat('#FDE047', 0.34, 0.1, 0.25, '#EAB308', 0.18)
    );
    transverseNode.name = 'transverse_node';
    nodalGroup.add(transverseNode);

    const longitudinalNode = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.03, 3.6),
      createMat('#38BDF8', 0.28, 0.1, 0.25, '#0284C7', 0.15)
    );
    longitudinalNode.name = 'longitudinal_node';
    longitudinalNode.visible = false;
    nodalGroup.add(longitudinalNode);

    const nodeBadge = createBadgeSprite('Nodal Plane (ψ = 0)', 'rgba(202, 138, 4, 0.92)', '#FEF9C3', 0.45);
    nodeBadge.position.set(0, -2.05, 0);
    nodalGroup.add(nodeBadge);
    registerPart(nodalGroup, 'nodal_surface', 'Nodal Surface', 0, [0, 0, 0]);
    modelGroup.add(nodalGroup);

    // 7. MO Energy-Level Diagram (3D physical correlation frame + dynamic canvas readout)
    const energyGroup = new THREE.Group();
    const diagramBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 2.5, 0.08),
      createMat('#0F172A', 0.88, 0.3, 0.4)
    );
    energyGroup.add(diagramBoard);

    // Left AO bar, Right AO bar, Lower Bonding MO bar, Upper Antibonding MO bar
    const aoBarL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.12), createMat('#38BDF8', 1, 0.3, 0.2));
    aoBarL.position.set(-1.55, 0.0, 0.06);
    energyGroup.add(aoBarL);

    const aoBarR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.12), createMat('#38BDF8', 1, 0.3, 0.2));
    aoBarR.position.set(1.55, 0.0, 0.06);
    energyGroup.add(aoBarR);

    const moBarBond = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.14), createMat('#10B981', 1, 0.3, 0.2, '#059669', 0.35));
    moBarBond.position.set(0, -0.68, 0.06);
    moBarBond.name = 'mo_bar_bond';
    energyGroup.add(moBarBond);

    const moBarAnti = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.14), createMat('#F43F5E', 1, 0.3, 0.2, '#E11D48', 0.35));
    moBarAnti.position.set(0, 0.78, 0.06);
    moBarAnti.name = 'mo_bar_anti';
    energyGroup.add(moBarAnti);

    energyGroup.position.set(0, 2.95, -2.2);
    registerPart(energyGroup, 'energy_diagram', 'MO Energy-Level Diagram', 2.95, [0, 2.95, -2.2]);
    modelGroup.add(energyGroup);

    return true;
  }

  // ============================================================================
  // MODEL 70: ATOMIC ORBITAL PROBABILITY EXPLORER
  // ============================================================================
  if (modelId === 'atomic-orbital-probability-explorer') {
    // 1. Cartesian Reference Axes
    const axesGroup = new THREE.Group();
    const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 6.8, 12), createMat('#EF4444', 0.75, 0.3, 0.3));
    xAxis.rotation.z = Math.PI / 2;
    axesGroup.add(xAxis);
    const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 6.8, 12), createMat('#10B981', 0.75, 0.3, 0.3));
    axesGroup.add(yAxis);
    const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 6.8, 12), createMat('#38BDF8', 0.75, 0.3, 0.3));
    zAxis.rotation.x = Math.PI / 2;
    axesGroup.add(zAxis);
    const xLabel = createBadgeSprite('+x', 'rgba(239,68,68,0.85)', '#FFF', 0.35);
    xLabel.position.set(3.55, 0, 0);
    axesGroup.add(xLabel);
    const yLabel = createBadgeSprite('+y', 'rgba(16,185,129,0.85)', '#FFF', 0.35);
    yLabel.position.set(0, 3.55, 0);
    axesGroup.add(yLabel);
    const zLabel = createBadgeSprite('+z', 'rgba(56,189,248,0.85)', '#FFF', 0.35);
    zLabel.position.set(0, 0, 3.55);
    axesGroup.add(zLabel);
    registerPart(axesGroup, 'coordinate_axes', 'Cartesian Reference Axes', 0, [0, 0, 0]);
    modelGroup.add(axesGroup);

    // 2. Central Atomic Nucleus
    const nucGroup = new THREE.Group();
    const nucMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      createMat('#F59E0B', 1.0, 0.4, 0.2, '#D97706', 0.4)
    );
    nucGroup.add(nucMesh);
    nucGroup.add(makeGlow('#F59E0B', 0.65, 0.5));
    registerPart(nucGroup, 'atomic_nucleus', 'Atomic Nucleus', 0, [0, 0, 0]);
    modelGroup.add(nucGroup);

    // 3. Probability Density Isosurface (supports 1s, 2s concentric + clipped, 2p bilobed, 3d_z2 dumbbell+torus, 3d cloverleaf)
    const isoGroup = new THREE.Group();
    // 1s / 2s outer spherical shell (full and hemisphere for cross-section)
    const sOuterFull = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 36, 36),
      createMat('#38BDF8', 0.42, 0.08, 0.18, '#0284C7', 0.15)
    );
    sOuterFull.name = 's_outer_full';
    isoGroup.add(sOuterFull);

    const sOuterHalf = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 36, 36, 0, Math.PI),
      createMat('#F43F5E', 0.48, 0.08, 0.18, '#E11D48', 0.18)
    );
    sOuterHalf.material.side = THREE.DoubleSide;
    sOuterHalf.name = 's_outer_half';
    sOuterHalf.visible = false;
    isoGroup.add(sOuterHalf);

    const sInnerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 32, 32),
      createMat('#38BDF8', 0.58, 0.1, 0.18, '#0284C7', 0.25)
    );
    sInnerCore.name = 's_inner_core';
    sInnerCore.visible = false;
    isoGroup.add(sInnerCore);

    // 2p bilobed dumbbell group
    const pLobesGroup = new THREE.Group();
    pLobesGroup.name = 'p_lobes_group';
    const pPosLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      createMat('#38BDF8', 0.48, 0.08, 0.18, '#0284C7', 0.2)
    );
    pPosLobe.position.set(0, 1.35, 0);
    pPosLobe.scale.set(0.85, 1.28, 0.85);
    pLobesGroup.add(pPosLobe);

    const pNegLobe = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      createMat('#F43F5E', 0.48, 0.08, 0.18, '#E11D48', 0.2)
    );
    pNegLobe.position.set(0, -1.35, 0);
    pNegLobe.scale.set(0.85, 1.28, 0.85);
    pLobesGroup.add(pNegLobe);
    isoGroup.add(pLobesGroup);

    // 3d_z2 dumbbell + equatorial torus ring
    const dz2Group = new THREE.Group();
    dz2Group.name = 'dz2_group';
    const dz2Top = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 32, 32),
      createMat('#38BDF8', 0.48, 0.08, 0.18, '#0284C7', 0.2)
    );
    dz2Top.position.set(0, 1.45, 0);
    dz2Top.scale.set(0.75, 1.35, 0.75);
    dz2Group.add(dz2Top);

    const dz2Bot = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 32, 32),
      createMat('#38BDF8', 0.48, 0.08, 0.18, '#0284C7', 0.2)
    );
    dz2Bot.position.set(0, -1.45, 0);
    dz2Bot.scale.set(0.75, 1.35, 0.75);
    dz2Group.add(dz2Bot);

    const dz2Torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.36, 24, 48),
      createMat('#F43F5E', 0.48, 0.08, 0.18, '#E11D48', 0.2)
    );
    dz2Torus.rotation.x = Math.PI / 2;
    dz2Group.add(dz2Torus);
    dz2Group.visible = false;
    isoGroup.add(dz2Group);

    // 3d cloverleaf 4-lobe group (for 3d_{x²-y²} and 3d_{xy})
    const dCloverGroup = new THREE.Group();
    dCloverGroup.name = 'd_clover_group';
    const cloverPositions: [number, number, number, string][] = [
      [1.45, 0, 0, '#38BDF8'],
      [-1.45, 0, 0, '#38BDF8'],
      [0, 1.45, 0, '#F43F5E'],
      [0, -1.45, 0, '#F43F5E'],
    ];
    cloverPositions.forEach(([cx, cy, cz, col], idx) => {
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(0.88, 28, 28),
        createMat(col, 0.48, 0.08, 0.18, col, 0.18)
      );
      lobe.position.set(cx, cy, cz);
      if (idx < 2) lobe.scale.set(1.3, 0.72, 0.72);
      else lobe.scale.set(0.72, 1.3, 0.72);
      dCloverGroup.add(lobe);
    });
    dCloverGroup.visible = false;
    isoGroup.add(dCloverGroup);

    registerPart(isoGroup, 'probability_isosurface', 'Probability Density Isosurface', 0, [0, 0, 0]);
    modelGroup.add(isoGroup);

    // 4. Quantum Probability Point Cloud (|ψ|² Monte Carlo sampling points)
    const cloudGroup = new THREE.Group();
    const numPoints = 420;
    const ptsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
      // Deterministic pseudo-random spherical coordinates
      const u = ((i * 73) % 1000) / 1000;
      const v = ((i * 197) % 1000) / 1000;
      const w = ((i * 353) % 1000) / 1000;
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = 0.35 + Math.pow(w, 0.6) * 2.15;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      colors[i * 3] = 0.35;
      colors[i * 3 + 1] = 0.82;
      colors[i * 3 + 2] = 0.98;
    }
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    ptsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const ptsMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const pointsMesh = new THREE.Points(ptsGeo, ptsMat);
    pointsMesh.name = 'born_points_mesh';
    cloudGroup.add(pointsMesh);
    registerPart(cloudGroup, 'probability_cloud', 'Quantum Probability Point Cloud', 0, [0, 0, 0]);
    modelGroup.add(cloudGroup);

    // 5. Radial Nodal Surface (spherical shell where R_{n,l}(r) = 0, visible for 2s)
    const radialNodeGroup = new THREE.Group();
    const radialNodeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.38, 32, 32, 0, Math.PI * 1.65),
      createMat('#FDE047', 0.35, 0.1, 0.25, '#EAB308', 0.2)
    );
    radialNodeSphere.material.side = THREE.DoubleSide;
    radialNodeGroup.add(radialNodeSphere);
    const radBadge = createBadgeSprite('Radial Node (r = 2a₀, ψ = 0)', 'rgba(202, 138, 4, 0.92)', '#FEF9C3', 0.42);
    radBadge.position.set(0, -1.7, 0);
    radialNodeGroup.add(radBadge);
    registerPart(radialNodeGroup, 'radial_node_sphere', 'Radial Nodal Surface', 0, [0, 0, 0]);
    modelGroup.add(radialNodeGroup);

    // 6. Angular Nodal Surface (planar or conical surfaces where Y_l^{m_l} = 0)
    const angularNodeGroup = new THREE.Group();
    const angPlane1 = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.03, 4.4),
      createMat('#F43F5E', 0.28, 0.1, 0.3, '#E11D48', 0.15)
    );
    angPlane1.name = 'ang_plane_1';
    angularNodeGroup.add(angPlane1);

    const angPlane2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 4.4, 4.4),
      createMat('#F43F5E', 0.28, 0.1, 0.3, '#E11D48', 0.15)
    );
    angPlane2.name = 'ang_plane_2';
    angPlane2.visible = false;
    angularNodeGroup.add(angPlane2);

    const coneTop = new THREE.Mesh(
      new THREE.ConeGeometry(1.75, 2.1, 32, 1, true),
      createMat('#FDE047', 0.28, 0.1, 0.3)
    );
    coneTop.material.side = THREE.DoubleSide;
    coneTop.position.set(0, 1.05, 0);
    coneTop.rotation.x = Math.PI;
    coneTop.name = 'ang_cone_top';
    coneTop.visible = false;
    angularNodeGroup.add(coneTop);

    const coneBot = new THREE.Mesh(
      new THREE.ConeGeometry(1.75, 2.1, 32, 1, true),
      createMat('#FDE047', 0.28, 0.1, 0.3)
    );
    coneBot.material.side = THREE.DoubleSide;
    coneBot.position.set(0, -1.05, 0);
    coneBot.name = 'ang_cone_bot';
    coneBot.visible = false;
    angularNodeGroup.add(coneBot);

    registerPart(angularNodeGroup, 'angular_node_plane', 'Angular Nodal Surface', 0, [0, 0, 0]);
    modelGroup.add(angularNodeGroup);

    return true;
  }

  // ============================================================================
  // MODEL 71: ADVANCED CRYSTAL LATTICE EXPLORER
  // ============================================================================
  if (modelId === 'advanced-crystal-lattice-explorer') {
    // 1. Unit Cell Boundary Frame (supports Cubic frame + Hexagonal Prism frame + 2x2x2 expanded sub-cells)
    const frameGroup = new THREE.Group();
    const cubicEdgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.0, 3.0, 3.0));
    const cubicWire = new THREE.LineSegments(
      cubicEdgesGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    cubicWire.name = 'cubic_wire_main';
    frameGroup.add(cubicWire);

    const hexEdgesGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.9, 1.9, 3.1, 6));
    const hexWire = new THREE.LineSegments(
      hexEdgesGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    hexWire.name = 'hex_wire_main';
    hexWire.visible = false;
    frameGroup.add(hexWire);

    // 8 expandable octant sub-cell frames to demonstrate real multi-cell expansion
    const subCellsGroup = new THREE.Group();
    subCellsGroup.name = 'expanded_subcells_group';
    const subEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5));
    const octantSigns: [number, number, number][] = [
      [-1, -1, -1],
      [1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1],
    ];
    octantSigns.forEach(([sx, sy, sz], idx) => {
      const subBox = new THREE.LineSegments(
        subEdgeGeo,
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.65 })
      );
      subBox.userData.octantSigns = [sx, sy, sz];
      subBox.name = `subcell_${idx}`;
      subCellsGroup.add(subBox);
    });
    frameGroup.add(subCellsGroup);

    registerPart(frameGroup, 'unit_cell_frame', 'Unit Cell Boundary Frame', 0, [0, 0, 0]);
    modelGroup.add(frameGroup);

    // 2. Corner Lattice Sites (8 cubic corners + 12 HCP corners)
    const cornerGroup = new THREE.Group();
    const cubicCornersSub = new THREE.Group();
    cubicCornersSub.name = 'cubic_corners_sub';
    octantSigns.forEach(([sx, sy, sz], idx) => {
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 28, 28),
        createMat('#38BDF8', 1.0, 0.35, 0.22, '#0284C7', 0.15)
      );
      atom.position.set(sx * 1.5, sy * 1.5, sz * 1.5);
      atom.userData.baseSign = [sx, sy, sz];
      cubicCornersSub.add(atom);
      if (idx === 6) {
        const lbl = createBadgeSprite('Corner (1/8)', 'rgba(2, 132, 199, 0.9)', '#E0F2FE', 0.42);
        lbl.position.set(sx * 1.5, sy * 1.5 + 0.68, sz * 1.5);
        lbl.name = 'corner_frac_badge';
        cubicCornersSub.add(lbl);
      }
    });
    cornerGroup.add(cubicCornersSub);

    const hcpCornersSub = new THREE.Group();
    hcpCornersSub.name = 'hcp_corners_sub';
    for (let layer = -1; layer <= 1; layer += 2) {
      for (let k = 0; k < 6; k++) {
        const ang = (k * Math.PI) / 3;
        const atom = new THREE.Mesh(
          new THREE.SphereGeometry(0.38, 24, 24),
          createMat('#38BDF8', 1.0, 0.35, 0.22, '#0284C7', 0.15)
        );
        atom.position.set(1.9 * Math.cos(ang), layer * 1.55, 1.9 * Math.sin(ang));
        atom.userData.baseSign = [Math.cos(ang), layer, Math.sin(ang)];
        hcpCornersSub.add(atom);
      }
    }
    const hcpCornerLbl = createBadgeSprite('Hex Corner (1/6)', 'rgba(2, 132, 199, 0.9)', '#E0F2FE', 0.42);
    hcpCornerLbl.position.set(1.9, 2.25, 0);
    hcpCornerLbl.name = 'hcp_corner_badge';
    hcpCornersSub.add(hcpCornerLbl);
    hcpCornersSub.visible = false;
    cornerGroup.add(hcpCornersSub);

    registerPart(cornerGroup, 'corner_atoms', 'Corner Lattice Sites', 0, [0, 0, 0]);
    modelGroup.add(cornerGroup);

    // 3. Face-Centred Lattice Sites (6 cubic faces for FCC; 2 basal faces for HCP)
    const faceGroup = new THREE.Group();
    const fccFacesSub = new THREE.Group();
    fccFacesSub.name = 'fcc_faces_sub';
    const faceDirs: [number, number, number][] = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    faceDirs.forEach(([fx, fy, fz], idx) => {
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 28, 28),
        createMat('#10B981', 1.0, 0.35, 0.22, '#059669', 0.18)
      );
      atom.position.set(fx * 1.5, fy * 1.5, fz * 1.5);
      atom.userData.baseSign = [fx, fy, fz];
      fccFacesSub.add(atom);
      if (idx === 2) {
        const lbl = createBadgeSprite('Face Center (1/2)', 'rgba(5, 150, 105, 0.92)', '#D1FAE5', 0.42);
        lbl.position.set(0, 2.25, 0);
        lbl.name = 'face_frac_badge';
        fccFacesSub.add(lbl);
      }
    });
    faceGroup.add(fccFacesSub);

    const hcpBasalSub = new THREE.Group();
    hcpBasalSub.name = 'hcp_basal_sub';
    [-1, 1].forEach((layer) => {
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 24, 24),
        createMat('#10B981', 1.0, 0.35, 0.22, '#059669', 0.18)
      );
      atom.position.set(0, layer * 1.55, 0);
      atom.userData.baseSign = [0, layer, 0];
      hcpBasalSub.add(atom);
    });
    hcpBasalSub.visible = false;
    faceGroup.add(hcpBasalSub);

    registerPart(faceGroup, 'face_center_atoms', 'Face-Centred Lattice Sites', 0, [0, 0, 0]);
    modelGroup.add(faceGroup);

    // 4. Body-Centred / Interior Sites (1 central atom in BCC; 3 mid-plane B-layer atoms in HCP)
    const bodyGroup = new THREE.Group();
    const bccBodyAtom = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 32, 32),
      createMat('#F59E0B', 1.0, 0.4, 0.2, '#D97706', 0.28)
    );
    bccBodyAtom.name = 'bcc_body_atom';
    bodyGroup.add(bccBodyAtom);
    const bodyBadge = createBadgeSprite('Interior Site (1/1)', 'rgba(217, 119, 6, 0.92)', '#FEF3C7', 0.42);
    bodyBadge.position.set(0, 0.85, 0);
    bodyBadge.name = 'body_frac_badge';
    bodyGroup.add(bodyBadge);

    const hcpMidSub = new THREE.Group();
    hcpMidSub.name = 'hcp_mid_sub';
    for (let k = 0; k < 3; k++) {
      const ang = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 28, 28),
        createMat('#F59E0B', 1.0, 0.4, 0.2, '#D97706', 0.28)
      );
      atom.position.set(1.05 * Math.cos(ang), 0, 1.05 * Math.sin(ang));
      hcpMidSub.add(atom);
    }
    hcpMidSub.visible = false;
    bodyGroup.add(hcpMidSub);

    registerPart(bodyGroup, 'body_interior_atoms', 'Body-Centred / Interior Sites', 0, [0, 0, 0]);
    modelGroup.add(bodyGroup);

    // 5. Nearest-Neighbour Coordination Shell (Struts highlighting CN = 6, 8, or 12)
    const coordGroup = new THREE.Group();
    // BCC 8 body-diagonal struts from center to 8 corners
    const bccStruts = new THREE.Group();
    bccStruts.name = 'bcc_coord_struts';
    octantSigns.forEach(([sx, sy, sz]) => {
      const target = new THREE.Vector3(sx * 1.5, sy * 1.5, sz * 1.5);
      const len = target.length();
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, len, 12),
        createMat('#F43F5E', 0.85, 0.3, 0.2, '#E11D48', 0.3)
      );
      strut.position.copy(target.clone().multiplyScalar(0.5));
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().normalize());
      bccStruts.add(strut);
    });
    coordGroup.add(bccStruts);

    // FCC 12 face-diagonal struts from top face center (0, 1.5, 0) to 4 top corners + 4 side face centers
    const fccStruts = new THREE.Group();
    fccStruts.name = 'fcc_coord_struts';
    const refFcc = new THREE.Vector3(0, 1.5, 0);
    const fccNeighbours: [number, number, number][] = [
      [1.5, 1.5, 1.5],
      [-1.5, 1.5, 1.5],
      [1.5, 1.5, -1.5],
      [-1.5, 1.5, -1.5],
      [1.5, 0, 0],
      [-1.5, 0, 0],
      [0, 0, 1.5],
      [0, 0, -1.5],
    ];
    fccNeighbours.forEach(([nx, ny, nz]) => {
      const target = new THREE.Vector3(nx, ny, nz);
      const diff = target.clone().sub(refFcc);
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, diff.length(), 12),
        createMat('#F43F5E', 0.85, 0.3, 0.2, '#E11D48', 0.3)
      );
      strut.position.copy(refFcc.clone().add(diff.clone().multiplyScalar(0.5)));
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
      fccStruts.add(strut);
    });
    coordGroup.add(fccStruts);

    // SC 6 edge struts from corner (-1.5,-1.5,1.5) along 3 cell edges
    const scStruts = new THREE.Group();
    scStruts.name = 'sc_coord_struts';
    const refSc = new THREE.Vector3(-1.5, -1.5, 1.5);
    const scTargets: [number, number, number][] = [
      [1.5, -1.5, 1.5],
      [-1.5, 1.5, 1.5],
      [-1.5, -1.5, -1.5],
    ];
    scTargets.forEach(([tx, ty, tz]) => {
      const target = new THREE.Vector3(tx, ty, tz);
      const diff = target.clone().sub(refSc);
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, diff.length(), 12),
        createMat('#F43F5E', 0.88, 0.3, 0.2, '#E11D48', 0.3)
      );
      strut.position.copy(refSc.clone().add(diff.clone().multiplyScalar(0.5)));
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
      scStruts.add(strut);
    });
    coordGroup.add(scStruts);

    registerPart(coordGroup, 'coordination_polyhedron', 'Nearest-Neighbour Coordination Shell', 0, [0, 0, 0]);
    modelGroup.add(coordGroup);

    // 6. Comparison Reference Unit Cell (displayed side-by-side when Comparison Mode != 'none')
    const compGroup = new THREE.Group();
    const compWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 2.4, 2.4)),
      new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85 })
    );
    compGroup.add(compWire);
    octantSigns.forEach(([sx, sy, sz]) => {
      const cAtom = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 20, 20),
        createMat('#A855F7', 0.92, 0.3, 0.25)
      );
      cAtom.position.set(sx * 1.2, sy * 1.2, sz * 1.2);
      compGroup.add(cAtom);
    });
    const compCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 20, 20),
      createMat('#F59E0B', 0.95, 0.35, 0.2)
    );
    compCenter.name = 'comp_center_atom';
    compGroup.add(compCenter);
    compGroup.position.set(4.6, 0, 0);
    compGroup.visible = false;
    registerPart(compGroup, 'comparison_lattice_cell', 'Comparison Reference Unit Cell', 0, [4.6, 0, 0]);
    modelGroup.add(compGroup);

    return true;
  }

  // ============================================================================
  // MODEL 72: MOLECULAR POLARITY EXPLORER
  // ============================================================================
  if (modelId === 'molecular-polarity-explorer') {
    // 1. Central Atom
    const centralGroup = new THREE.Group();
    const centralMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 32, 32),
      createMat('#EF4444', 1.0, 0.25, 0.28)
    );
    centralMesh.name = 'central_atom_mesh';
    centralGroup.add(centralMesh);
    registerPart(centralGroup, 'central_atom', 'Central Atom', 0, [0, 0, 0]);
    modelGroup.add(centralGroup);

    // 2. Terminal Atoms (up to 4 terminal atoms for CH4)
    const termGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const tMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 28, 28),
        createMat('#F8FAFC', 1.0, 0.2, 0.3)
      );
      tMesh.name = `term_atom_${i}`;
      termGroup.add(tMesh);
    }
    registerPart(termGroup, 'terminal_atoms', 'Terminal Atoms', 0, [0, 0, 0]);
    modelGroup.add(termGroup);

    // 3. Covalent Bond Cylinders
    const bondsGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const bMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 1.0, 20),
        createMat('#CBD5E1', 1.0, 0.3, 0.35)
      );
      bMesh.name = `bond_cyl_${i}`;
      bondsGroup.add(bMesh);
    }
    registerPart(bondsGroup, 'covalent_bonds', 'Covalent Bond Cylinders', 0, [0, 0, 0]);
    modelGroup.add(bondsGroup);

    // 4. Bond Dipole Vectors (crossed-tail +—▸ arrows along each bond)
    const bondDipoleGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const arrowSub = new THREE.Group();
      arrowSub.name = `bond_dipole_${i}`;
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.0, 14),
        createMat('#06B6D4', 0.95, 0.2, 0.2, '#0891B2', 0.25)
      );
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.32, 16),
        createMat('#06B6D4', 0.95, 0.2, 0.2, '#0891B2', 0.25)
      );
      head.position.y = 0.55;
      // Crossed tail bar (+) showing electropositive tail convention
      const crossBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.045, 0.045),
        createMat('#06B6D4', 0.95, 0.2, 0.2)
      );
      crossBar.position.y = -0.35;
      arrowSub.add(shaft, head, crossBar);
      bondDipoleGroup.add(arrowSub);
    }
    registerPart(bondDipoleGroup, 'bond_dipole_vectors', 'Bond Dipole Vectors', 0, [0, 0, 0]);
    modelGroup.add(bondDipoleGroup);

    // 5. Resultant Molecular Dipole Vector (Gold net dipole arrow +—▸ or symmetry-cancellation badge)
    const resDipoleGroup = new THREE.Group();
    const resArrowSub = new THREE.Group();
    resArrowSub.name = 'res_arrow_sub';
    const resShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 1.8, 18),
      createMat('#F59E0B', 1.0, 0.35, 0.2, '#D97706', 0.35)
    );
    const resHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.48, 20),
      createMat('#F59E0B', 1.0, 0.35, 0.2, '#D97706', 0.35)
    );
    resHead.position.y = 1.05;
    const resCross = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.07, 0.07),
      createMat('#F59E0B', 1.0, 0.35, 0.2)
    );
    resCross.position.y = -0.65;
    resArrowSub.add(resShaft, resHead, resCross);
    resDipoleGroup.add(resArrowSub);

    const zeroDipoleRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.05, 16, 36),
      createMat('#10B981', 0.85, 0.2, 0.2, '#059669', 0.25)
    );
    zeroDipoleRing.name = 'zero_dipole_ring';
    zeroDipoleRing.visible = false;
    resDipoleGroup.add(zeroDipoleRing);

    registerPart(resDipoleGroup, 'resultant_dipole_vector', 'Resultant Molecular Dipole Vector', 0, [0, 0, 0]);
    modelGroup.add(resDipoleGroup);

    // 6. Partial Charge & Lone Pair Markers
    const chargeGroup = new THREE.Group();
    const centralChargeBadge = createBadgeSprite('δ⁻', 'rgba(225, 29, 72, 0.9)', '#FFE4E6', 0.45);
    centralChargeBadge.name = 'central_charge_badge';
    centralChargeBadge.position.set(0, 0.95, 0);
    chargeGroup.add(centralChargeBadge);

    for (let i = 0; i < 4; i++) {
      const termBadge = createBadgeSprite('δ⁺', 'rgba(2, 132, 199, 0.9)', '#E0F2FE', 0.38);
      termBadge.name = `term_charge_badge_${i}`;
      chargeGroup.add(termBadge);
    }

    // Translucent Lone Pair lobes (2 for H2O, 1 for NH3)
    const lp1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      createMat('#A855F7', 0.34, 0.05, 0.2, '#9333EA', 0.2)
    );
    lp1.scale.set(0.75, 1.35, 0.75);
    lp1.name = 'lone_pair_1';
    chargeGroup.add(lp1);

    const lp2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      createMat('#A855F7', 0.34, 0.05, 0.2, '#9333EA', 0.2)
    );
    lp2.scale.set(0.75, 1.35, 0.75);
    lp2.name = 'lone_pair_2';
    chargeGroup.add(lp2);

    registerPart(chargeGroup, 'partial_charge_markers', 'Partial Charge & Lone Pair Markers', 0, [0, 0, 0]);
    modelGroup.add(chargeGroup);

    // 7. VSEPR Bond Angle Arc
    const arcGroup = new THREE.Group();
    const arcTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.035, 14, 32, Math.PI * 0.58),
      createMat('#A855F7', 0.85, 0.2, 0.3, '#9333EA', 0.2)
    );
    arcTorus.name = 'vsepr_arc_torus';
    arcGroup.add(arcTorus);
    registerPart(arcGroup, 'geometry_angle_arc', 'VSEPR Bond Angle Arc', 0, [0, 0, 0]);
    modelGroup.add(arcGroup);

    return true;
  }

  // ============================================================================
  // MODEL 73: INTERMOLECULAR FORCES EXPLORER
  // ============================================================================
  if (modelId === 'intermolecular-forces-explorer') {
    // Helper to build a generic multi-atom molecule subgroup (adaptable to H2O, HCl, Ar, I2)
    const buildMoleculeRig = (prefix: string) => {
      const rig = new THREE.Group();
      const coreA = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 28, 28),
        createMat('#EF4444', 1.0, 0.25, 0.28)
      );
      coreA.name = `${prefix}_core`;
      rig.add(coreA);

      const sub1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 24),
        createMat('#F8FAFC', 1.0, 0.2, 0.3)
      );
      sub1.name = `${prefix}_sub1`;
      rig.add(sub1);

      const sub2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 24),
        createMat('#F8FAFC', 1.0, 0.2, 0.3)
      );
      sub2.name = `${prefix}_sub2`;
      rig.add(sub2);

      const bond1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.9, 16),
        createMat('#CBD5E1', 1.0, 0.3, 0.3)
      );
      bond1.name = `${prefix}_bond1`;
      rig.add(bond1);

      const bond2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.9, 16),
        createMat('#CBD5E1', 1.0, 0.3, 0.3)
      );
      bond2.name = `${prefix}_bond2`;
      rig.add(bond2);

      const badgeNeg = createBadgeSprite('δ⁻', 'rgba(225, 29, 72, 0.9)', '#FFE4E6', 0.38);
      badgeNeg.position.set(-0.35, 0.78, 0);
      badgeNeg.name = `${prefix}_badge_neg`;
      rig.add(badgeNeg);

      const badgePos = createBadgeSprite('δ⁺', 'rgba(2, 132, 199, 0.9)', '#E0F2FE', 0.38);
      badgePos.position.set(0.65, 0.65, 0);
      badgePos.name = `${prefix}_badge_pos`;
      rig.add(badgePos);

      return rig;
    };

    // 1. Primary Donor / Left Molecule
    const mol1Group = buildMoleculeRig('mol1');
    mol1Group.position.set(-1.6, 0, 0);
    registerPart(mol1Group, 'molecule_1', 'Primary Donor / Left Molecule', 0, [-1.6, 0, 0]);
    modelGroup.add(mol1Group);

    // 2. Partner Acceptor / Right Molecule
    const mol2Group = buildMoleculeRig('mol2');
    mol2Group.position.set(1.6, 0, 0);
    registerPart(mol2Group, 'molecule_2', 'Partner Acceptor / Right Molecule', 0, [1.6, 0, 0]);
    modelGroup.add(mol2Group);

    // 3. Intermolecular Attraction Overlay (Dashed non-covalent force beads — NEVER a solid bond cylinder!)
    const imfOverlayGroup = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const dashBead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.16, 14),
        createMat('#10B981', 0.92, 0.2, 0.2, '#059669', 0.35)
      );
      dashBead.rotation.z = Math.PI / 2;
      dashBead.name = `imf_dash_${i}`;
      imfOverlayGroup.add(dashBead);
    }
    registerPart(imfOverlayGroup, 'imf_attraction_overlay', 'Intermolecular Attraction Overlay', 0, [0, 0, 0]);
    modelGroup.add(imfOverlayGroup);

    // 4. Polarizable Electron Cloud Hull
    const hullGroup = new THREE.Group();
    const hull1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 28, 28),
      createMat('#38BDF8', 0.22, 0.05, 0.2, '#0284C7', 0.15)
    );
    hull1.name = 'hull_1';
    hullGroup.add(hull1);

    const hull2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 28, 28),
      createMat('#38BDF8', 0.22, 0.05, 0.2, '#0284C7', 0.15)
    );
    hull2.name = 'hull_2';
    hullGroup.add(hull2);
    registerPart(hullGroup, 'electron_cloud_hull', 'Polarizable Electron Cloud Hull', 0, [0, 0, 0]);
    modelGroup.add(hullGroup);

    // 5. Potential Energy Well Indicator
    const wellGroup = new THREE.Group();
    const wellBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.35, 0.08),
      createMat('#0F172A', 0.88, 0.3, 0.4)
    );
    wellGroup.add(wellBoard);
    const liveMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 20),
      createMat('#F59E0B', 1.0, 0.3, 0.2, '#D97706', 0.4)
    );
    liveMarker.position.set(0, 0, 0.08);
    liveMarker.name = 'lj_live_marker';
    wellGroup.add(liveMarker);
    wellGroup.position.set(0, -2.35, -1.2);
    registerPart(wellGroup, 'energy_well_curve', 'Potential Energy Well Indicator', -2.35, [0, -2.35, -1.2]);
    modelGroup.add(wellGroup);

    // 6. Comparison Molecular System
    const compImfGroup = new THREE.Group();
    const compBar = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.9, 0.1),
      createMat('#1E1B4B', 0.9, 0.3, 0.4)
    );
    compImfGroup.add(compBar);
    compImfGroup.position.set(0, 2.55, -1.5);
    compImfGroup.visible = false;
    registerPart(compImfGroup, 'comparison_dimer_pair', 'Comparison Molecular System', 2.55, [0, 2.55, -1.5]);
    modelGroup.add(compImfGroup);

    return true;
  }

  // ============================================================================
  // MODEL 74: ELECTROCHEMICAL CELL SIMULATOR
  // ============================================================================
  if (modelId === 'electrochemical-cell-simulator') {
    // 1. Anode Electrolyte Solution & Left Beaker
    const anodeSolGroup = new THREE.Group();
    const leftGlassBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 2.6, 32, 1, true),
      createMat('#E2E8F0', 0.22, 0.1, 0.1)
    );
    leftGlassBeaker.material.side = THREE.DoubleSide;
    anodeSolGroup.add(leftGlassBeaker);

    const anodeLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(1.44, 1.44, 2.0, 32),
      createMat('#E0F2FE', 0.35, 0.05, 0.15)
    );
    anodeLiquid.position.y = -0.25;
    anodeLiquid.name = 'anode_liquid_mesh';
    anodeSolGroup.add(anodeLiquid);
    anodeSolGroup.position.set(-2.6, -0.5, 0);
    registerPart(anodeSolGroup, 'anode_electrolyte', 'Anode Electrolyte Solution', -0.5, [-2.6, -0.5, 0]);
    modelGroup.add(anodeSolGroup);

    // 2. Cathode Electrolyte Solution & Right Beaker
    const cathodeSolGroup = new THREE.Group();
    const rightGlassBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 2.6, 32, 1, true),
      createMat('#E2E8F0', 0.22, 0.1, 0.1)
    );
    rightGlassBeaker.material.side = THREE.DoubleSide;
    cathodeSolGroup.add(rightGlassBeaker);

    const cathodeLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(1.44, 1.44, 2.0, 32),
      createMat('#0284C7', 0.52, 0.05, 0.15)
    );
    cathodeLiquid.position.y = -0.25;
    cathodeLiquid.name = 'cathode_liquid_mesh';
    cathodeSolGroup.add(cathodeLiquid);
    cathodeSolGroup.position.set(2.6, -0.5, 0);
    registerPart(cathodeSolGroup, 'cathode_electrolyte', 'Cathode Electrolyte Solution', -0.5, [2.6, -0.5, 0]);
    modelGroup.add(cathodeSolGroup);

    // 3. Anode Electrode (− Oxidation)
    const anodeElecGroup = new THREE.Group();
    const anodePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 2.6, 0.16),
      createMat('#94A3B8', 1.0, 0.78, 0.25)
    );
    anodePlate.name = 'anode_plate_mesh';
    anodeElecGroup.add(anodePlate);
    const anodeBadge = createBadgeSprite('ANODE (−) Oxidation', 'rgba(30, 41, 59, 0.92)', '#38BDF8', 0.48);
    anodeBadge.position.set(0, 1.65, 0);
    anodeElecGroup.add(anodeBadge);
    anodeElecGroup.position.set(-2.95, 0.25, 0);
    registerPart(anodeElecGroup, 'anode_electrode', 'Anode Electrode (− Oxidation)', 0.25, [-2.95, 0.25, 0]);
    modelGroup.add(anodeElecGroup);

    // 4. Cathode Electrode (+ Reduction)
    const cathodeElecGroup = new THREE.Group();
    const cathodePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 2.6, 0.16),
      createMat('#D97706', 1.0, 0.78, 0.22)
    );
    cathodePlate.name = 'cathode_plate_mesh';
    cathodeElecGroup.add(cathodePlate);
    const cathodeBadge = createBadgeSprite('CATHODE (+) Reduction', 'rgba(180, 83, 9, 0.92)', '#FEF3C7', 0.48);
    cathodeBadge.position.set(0, 1.65, 0);
    cathodeElecGroup.add(cathodeBadge);
    cathodeElecGroup.position.set(2.95, 0.25, 0);
    registerPart(cathodeElecGroup, 'cathode_electrode', 'Cathode Electrode (+ Reduction)', 0.25, [2.95, 0.25, 0]);
    modelGroup.add(cathodeElecGroup);

    // 5. Salt Bridge (KNO₃ Ionic Conduit)
    const bridgeGroup = new THREE.Group();
    const bridgeArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.22, 20, 48, Math.PI),
      createMat('#F8FAFC', 0.48, 0.1, 0.2)
    );
    bridgeArch.position.y = 0.2;
    bridgeGroup.add(bridgeArch);
    const leftLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.3, 20),
      createMat('#F8FAFC', 0.48, 0.1, 0.2)
    );
    leftLeg.position.set(-1.85, -0.45, 0);
    bridgeGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.3, 20),
      createMat('#F8FAFC', 0.48, 0.1, 0.2)
    );
    rightLeg.position.set(1.85, -0.45, 0);
    bridgeGroup.add(rightLeg);
    const bridgeBadge = createBadgeSprite('KNO₃ Salt Bridge (Ions Only)', 'rgba(15, 23, 42, 0.9)', '#E2E8F0', 0.45);
    bridgeBadge.position.set(0, 1.45, 0);
    bridgeGroup.add(bridgeBadge);
    registerPart(bridgeGroup, 'salt_bridge', 'Salt Bridge (KNO₃ Ionic Conduit)', 0, [0, 0, 0]);
    modelGroup.add(bridgeGroup);

    // 6. External Conducting Wire Circuit + Electron Flow Beads
    const wireGroup = new THREE.Group();
    const leftRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.5, 14),
      createMat('#475569', 1.0, 0.8, 0.2)
    );
    leftRiser.position.set(-2.95, 2.25, 0);
    wireGroup.add(leftRiser);

    const rightRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.5, 14),
      createMat('#475569', 1.0, 0.8, 0.2)
    );
    rightRiser.position.set(2.95, 2.25, 0);
    wireGroup.add(rightRiser);

    const topCrossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 5.9, 16),
      createMat('#475569', 1.0, 0.8, 0.2)
    );
    topCrossbar.rotation.z = Math.PI / 2;
    topCrossbar.position.set(0, 3.0, 0);
    wireGroup.add(topCrossbar);

    // Animated electron particles travelling ONLY on the external wire
    const eBeadsSub = new THREE.Group();
    eBeadsSub.name = 'external_electrons_sub';
    for (let i = 0; i < 10; i++) {
      const eBead = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        createMat('#38BDF8', 1.0, 0.2, 0.1, '#0EA5E9', 0.6)
      );
      eBeadsSub.add(eBead);
    }
    wireGroup.add(eBeadsSub);
    registerPart(wireGroup, 'external_wire_circuit', 'External Conducting Wire Circuit', 0, [0, 0, 0]);
    modelGroup.add(wireGroup);

    // 7. High-Impedance Digital Voltmeter
    const meterGroup = new THREE.Group();
    const meterBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.05, 0.35),
      createMat('#0F172A', 1.0, 0.45, 0.3)
    );
    meterGroup.add(meterBody);
    meterGroup.position.set(0, 3.05, 0);
    registerPart(meterGroup, 'digital_voltmeter', 'High-Impedance Digital Voltmeter', 3.05, [0, 3.05, 0]);
    modelGroup.add(meterGroup);

    // 8. Mobile Electrolyte Ions (in half-cells and salt bridge)
    const ionsGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const isAnion = i % 2 === 1;
      const ionMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        createMat(isAnion ? '#F43F5E' : '#10B981', 0.92, 0.2, 0.2)
      );
      ionMesh.name = `galv_ion_${i}`;
      ionsGroup.add(ionMesh);
    }
    registerPart(ionsGroup, 'electrolyte_ions', 'Mobile Electrolyte Ions', 0, [0, 0, 0]);
    modelGroup.add(ionsGroup);

    return true;
  }

  // ============================================================================
  // MODEL 75: ELECTROLYSIS EXPLORER
  // ============================================================================
  if (modelId === 'electrolysis-explorer') {
    // 1. Electrolyte Container & Melt/Solution
    const bathGroup = new THREE.Group();
    const outerVat = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55, 2.55, 2.7, 36, 1, true),
      createMat('#CBD5E1', 0.25, 0.15, 0.12)
    );
    outerVat.material.side = THREE.DoubleSide;
    bathGroup.add(outerVat);

    const bathLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(2.45, 2.45, 2.15, 36),
      createMat('#F59E0B', 0.42, 0.08, 0.15, '#D97706', 0.18)
    );
    bathLiquid.position.y = -0.22;
    bathLiquid.name = 'electrolysis_liquid_mesh';
    bathGroup.add(bathLiquid);
    bathGroup.position.set(0, -0.55, 0);
    registerPart(bathGroup, 'electrolyte_bath', 'Electrolyte Container & Melt/Solution', -0.55, [0, -0.55, 0]);
    modelGroup.add(bathGroup);

    // 2. Negative Cathode (− Reduction)
    const cathodeGroup = new THREE.Group();
    const cathodeRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 2.55, 24),
      createMat('#334155', 1.0, 0.7, 0.25)
    );
    cathodeGroup.add(cathodeRod);
    const catBadge = createBadgeSprite('CATHODE (−) Reduction', 'rgba(2, 132, 199, 0.92)', '#E0F2FE', 0.48);
    catBadge.position.set(0, 1.58, 0);
    cathodeGroup.add(catBadge);
    cathodeGroup.position.set(-1.45, 0.15, 0);
    registerPart(cathodeGroup, 'cathode_electrode_neg', 'Negative Cathode (− Reduction)', 0.15, [-1.45, 0.15, 0]);
    modelGroup.add(cathodeGroup);

    // 3. Positive Anode (+ Oxidation)
    const anodeGroup = new THREE.Group();
    const anodeRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 2.55, 24),
      createMat('#334155', 1.0, 0.7, 0.25)
    );
    anodeGroup.add(anodeRod);
    const anBadge = createBadgeSprite('ANODE (+) Oxidation', 'rgba(225, 29, 72, 0.92)', '#FFE4E6', 0.48);
    anBadge.position.set(0, 1.58, 0);
    anodeGroup.add(anBadge);
    anodeGroup.position.set(1.45, 0.15, 0);
    registerPart(anodeGroup, 'anode_electrode_pos', 'Positive Anode (+ Oxidation)', 0.15, [1.45, 0.15, 0]);
    modelGroup.add(anodeGroup);

    // 4. External DC Power Source
    const dcSupplyGroup = new THREE.Group();
    const supplyChassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.1, 0.65),
      createMat('#0F172A', 1.0, 0.45, 0.3)
    );
    dcSupplyGroup.add(supplyChassis);
    const negTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), createMat('#38BDF8', 1, 0.5, 0.2));
    negTerm.position.set(-0.75, -0.6, 0);
    dcSupplyGroup.add(negTerm);
    const posTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), createMat('#F43F5E', 1, 0.5, 0.2));
    posTerm.position.set(0.75, -0.6, 0);
    dcSupplyGroup.add(posTerm);
    dcSupplyGroup.position.set(0, 3.05, 0);
    registerPart(dcSupplyGroup, 'dc_power_supply', 'External DC Power Source', 3.05, [0, 3.05, 0]);
    modelGroup.add(dcSupplyGroup);

    // 5. External DC Circuit Wires + Electron Flow
    const dcWiresGroup = new THREE.Group();
    const leftLead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.6, 14),
      createMat('#38BDF8', 1.0, 0.6, 0.25)
    );
    leftLead.position.set(-1.45, 2.15, 0);
    dcWiresGroup.add(leftLead);

    const rightLead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.6, 14),
      createMat('#F43F5E', 1.0, 0.6, 0.25)
    );
    rightLead.position.set(1.45, 2.15, 0);
    dcWiresGroup.add(rightLead);

    const topWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.9, 14),
      createMat('#64748B', 1.0, 0.7, 0.25)
    );
    topWire.rotation.z = Math.PI / 2;
    topWire.position.set(0, 2.95, 0);
    dcWiresGroup.add(topWire);

    const dcElectronsSub = new THREE.Group();
    dcElectronsSub.name = 'dc_electrons_sub';
    for (let i = 0; i < 10; i++) {
      const eDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 14, 14),
        createMat('#38BDF8', 1.0, 0.2, 0.1, '#0EA5E9', 0.6)
      );
      dcElectronsSub.add(eDot);
    }
    dcWiresGroup.add(dcElectronsSub);
    registerPart(dcWiresGroup, 'external_dc_wires', 'External DC Circuit Wires', 0, [0, 0, 0]);
    modelGroup.add(dcWiresGroup);

    // 6. Mobile Cations & Anions (inside the electrolyte bath)
    const mobileIonsGroup = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const isCation = i < 7;
      const ionSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 18, 18),
        createMat(isCation ? '#38BDF8' : '#A3E635', 0.92, 0.2, 0.2)
      );
      ionSphere.name = `elec_ion_${i}`;
      mobileIonsGroup.add(ionSphere);
    }
    registerPart(mobileIonsGroup, 'mobile_ions_cloud', 'Mobile Cations & Anions', 0, [0, 0, 0]);
    modelGroup.add(mobileIonsGroup);

    // 7. Cathode Product Formation Region (Plating sleeve + Cathode gas bubbles)
    const catProdGroup = new THREE.Group();
    const platingSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 1.35, 24),
      createMat('#E2E8F0', 0.92, 0.85, 0.15)
    );
    platingSleeve.position.set(-1.45, -0.45, 0);
    platingSleeve.name = 'cathode_plating_sleeve';
    catProdGroup.add(platingSleeve);

    const catBubblesSub = new THREE.Group();
    catBubblesSub.name = 'cathode_bubbles_sub';
    for (let i = 0; i < 16; i++) {
      const bub = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 14, 14),
        createMat('#F8FAFC', 0.65, 0.1, 0.1)
      );
      catBubblesSub.add(bub);
    }
    catProdGroup.add(catBubblesSub);
    registerPart(catProdGroup, 'cathode_product_zone', 'Cathode Product Formation Region', 0, [0, 0, 0]);
    modelGroup.add(catProdGroup);

    // 8. Anode Product Formation Region (Anodic Cl2 / O2 gas bubble stream)
    const anProdGroup = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const bub = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 14, 14),
        createMat('#A3E635', 0.72, 0.1, 0.15)
      );
      bub.name = `anode_bub_${i}`;
      anProdGroup.add(bub);
    }
    registerPart(anProdGroup, 'anode_product_zone', 'Anode Product Formation Region', 0, [0, 0, 0]);
    modelGroup.add(anProdGroup);

    return true;
  }

  return false;
}

/**
 * Live per-frame scientific animation and parameter synchronization for Models 69–75
 */
export function animateChemistryBatch1Model(
  modelId: string,
  modelGroup: THREE.Group,
  t: number,
  p: Record<string, any>
): boolean {
  // ============================================================================
  // MODEL 69: MOLECULAR ORBITAL EXPLORER
  // ============================================================================
  if (modelId === 'molecular-orbital-explorer') {
    const metrics = calculateMolecularOrbitalMetrics({
      orbitalPreset: p.orbitalPreset,
      combinationProgressPct: p.combinationProgressPct,
      internuclearDistanceAngstrom: p.internuclearDistanceAngstrom,
      electronOccupancyConfig: p.electronOccupancyConfig,
    });

    const showPhase = (p.showPhaseColors ?? 1) >= 0.5;
    const showNodes = (p.showNodalSurface ?? 1) >= 0.5;
    const showDiagram = (p.showEnergyDiagram ?? 1) >= 0.5;
    const combFrac = metrics.combinationProgressPct / 100;

    // Position Nuclei A and B according to R and combination progress
    const halfSep = (metrics.internuclearDistanceAngstrom * 0.95) + (1 - combFrac) * 1.15;
    const nucA = modelGroup.getObjectByName('nucleus_a');
    const nucB = modelGroup.getObjectByName('nucleus_b');
    if (nucA) nucA.position.x = -halfSep;
    if (nucB) nucB.position.x = halfSep;

    // Atomic orbitals fade out as combination approaches 100%, and move with nuclei
    const aoA = modelGroup.getObjectByName('ao_a');
    const aoB = modelGroup.getObjectByName('ao_b');
    const isAnti = metrics.orbitalPreset.includes('_star_');
    const isPi = metrics.orbitalPreset.includes('_pi_');
    const is2p = metrics.orbitalPreset.startsWith('p2_');

    if (aoA && aoB) {
      aoA.position.x = -halfSep;
      aoB.position.x = halfSep;
      const aoOpacity = Math.max(0.08, 0.52 * (1 - combFrac * 0.82));
      const aoAPos = aoA.getObjectByName('ao_a_pos_lobe') as THREE.Mesh | undefined;
      const aoANeg = aoA.getObjectByName('ao_a_neg_lobe') as THREE.Mesh | undefined;
      const aoBPos = aoB.getObjectByName('ao_b_pos_lobe') as THREE.Mesh | undefined;
      const aoBNeg = aoB.getObjectByName('ao_b_neg_lobe') as THREE.Mesh | undefined;

      if (aoAPos && aoANeg && aoBPos && aoBNeg) {
        (aoAPos.material as THREE.MeshStandardMaterial).opacity = aoOpacity;
        (aoBPos.material as THREE.MeshStandardMaterial).opacity = aoOpacity;
        (aoBPos.material as THREE.MeshStandardMaterial).color.set(
          showPhase ? (isAnti && !is2p ? '#F43F5E' : '#38BDF8') : '#64748B'
        );
        (aoAPos.material as THREE.MeshStandardMaterial).color.set(showPhase ? '#38BDF8' : '#64748B');

        if (isPi) {
          aoAPos.position.set(0, 0.65, 0);
          aoAPos.scale.set(0.65, 0.95, 0.65);
          aoANeg.visible = true;
          aoANeg.position.set(0, -0.65, 0);
          aoANeg.scale.set(0.65, 0.95, 0.65);

          aoBPos.position.set(0, isAnti ? -0.65 : 0.65, 0);
          aoBPos.scale.set(0.65, 0.95, 0.65);
          aoBNeg.visible = true;
          aoBNeg.position.set(0, isAnti ? 0.65 : -0.65, 0);
          aoBNeg.scale.set(0.65, 0.95, 0.65);
        } else {
          aoAPos.position.set(0, 0, 0);
          aoAPos.scale.set(1, 1, 1);
          aoANeg.visible = false;
          aoBPos.position.set(0, 0, 0);
          aoBPos.scale.set(1, 1, 1);
          aoBNeg.visible = false;
        }
      }
      const badgeA = aoA.getObjectByName('ao_a_phase_badge');
      const badgeB = aoB.getObjectByName('ao_b_phase_badge');
      if (badgeA) badgeA.visible = showPhase && combFrac < 0.75;
      if (badgeB) badgeB.visible = showPhase && combFrac < 0.75;
    }

    // Bonding vs Antibonding MO visibility and morphing
    const moBond = modelGroup.getObjectByName('mo_bonding');
    const moAnti = modelGroup.getObjectByName('mo_antibonding');
    const pulse = 1 + 0.025 * Math.sin(t * 2.4);

    if (moBond) {
      moBond.visible = !isAnti && combFrac > 0.05;
      const sigmaCenter = moBond.getObjectByName('sigma_bond_center') as THREE.Mesh | undefined;
      const s2pLeft = moBond.getObjectByName('sigma2p_outer_left') as THREE.Mesh | undefined;
      const s2pRight = moBond.getObjectByName('sigma2p_outer_right') as THREE.Mesh | undefined;
      const piUp = moBond.getObjectByName('pi_bond_upper') as THREE.Mesh | undefined;
      const piLow = moBond.getObjectByName('pi_bond_lower') as THREE.Mesh | undefined;
      const bPlus = moBond.getObjectByName('bond_phase_plus');

      if (bPlus) bPlus.visible = showPhase;
      const posColor = showPhase ? '#0EA5E9' : '#64748B';
      const negColor = showPhase ? '#F43F5E' : '#475569';

      if (sigmaCenter && s2pLeft && s2pRight && piUp && piLow) {
        if (isPi) {
          sigmaCenter.visible = false;
          s2pLeft.visible = false;
          s2pRight.visible = false;
          piUp.visible = true;
          piLow.visible = true;
          piUp.scale.set((halfSep + 0.7) * combFrac * pulse, 0.72 * combFrac, 0.82 * combFrac);
          piLow.scale.set((halfSep + 0.7) * combFrac * pulse, 0.72 * combFrac, 0.82 * combFrac);
          (piUp.material as THREE.MeshStandardMaterial).color.set(posColor);
          (piLow.material as THREE.MeshStandardMaterial).color.set(negColor);
        } else {
          sigmaCenter.visible = true;
          piUp.visible = false;
          piLow.visible = false;
          sigmaCenter.scale.set((halfSep + 0.65) * Math.max(0.3, combFrac) * pulse, 1.05 * combFrac, 1.05 * combFrac);
          (sigmaCenter.material as THREE.MeshStandardMaterial).color.set(posColor);
          s2pLeft.visible = is2p;
          s2pRight.visible = is2p;
          s2pLeft.position.x = -(halfSep + 0.85);
          s2pRight.position.x = halfSep + 0.85;
          (s2pLeft.material as THREE.MeshStandardMaterial).color.set(negColor);
          (s2pRight.material as THREE.MeshStandardMaterial).color.set(negColor);
        }
      }
    }

    if (moAnti) {
      moAnti.visible = isAnti && combFrac > 0.05;
      const aLeft = moAnti.getObjectByName('anti_left_lobe') as THREE.Mesh | undefined;
      const aRight = moAnti.getObjectByName('anti_right_lobe') as THREE.Mesh | undefined;
      const pTL = moAnti.getObjectByName('pi_star_tl') as THREE.Mesh | undefined;
      const pBL = moAnti.getObjectByName('pi_star_bl') as THREE.Mesh | undefined;
      const pTR = moAnti.getObjectByName('pi_star_tr') as THREE.Mesh | undefined;
      const pBR = moAnti.getObjectByName('pi_star_br') as THREE.Mesh | undefined;
      const bL = moAnti.getObjectByName('anti_badge_l');
      const bR = moAnti.getObjectByName('anti_badge_r');
      if (bL) bL.visible = showPhase;
      if (bR) bR.visible = showPhase;

      const posColor = showPhase ? '#0EA5E9' : '#64748B';
      const negColor = showPhase ? '#F43F5E' : '#475569';

      if (aLeft && aRight && pTL && pBL && pTR && pBR) {
        if (isPi) {
          aLeft.visible = false;
          aRight.visible = false;
          pTL.visible = true;
          pBL.visible = true;
          pTR.visible = true;
          pBR.visible = true;
          pTL.position.set(-(halfSep + 0.25), 1.05, 0);
          pBL.position.set(-(halfSep + 0.25), -1.05, 0);
          pTR.position.set(halfSep + 0.25, 1.05, 0);
          pBR.position.set(halfSep + 0.25, -1.05, 0);
          (pTL.material as THREE.MeshStandardMaterial).color.set(posColor);
          (pBL.material as THREE.MeshStandardMaterial).color.set(negColor);
          (pTR.material as THREE.MeshStandardMaterial).color.set(negColor);
          (pBR.material as THREE.MeshStandardMaterial).color.set(posColor);
        } else {
          aLeft.visible = true;
          aRight.visible = true;
          pTL.visible = false;
          pBL.visible = false;
          pTR.visible = false;
          pBR.visible = false;
          aLeft.position.x = -(halfSep + 0.65);
          aRight.position.x = halfSep + 0.65;
          aLeft.scale.set(1.1 * combFrac * pulse, 0.95 * combFrac, 0.95 * combFrac);
          aRight.scale.set(1.1 * combFrac * pulse, 0.95 * combFrac, 0.95 * combFrac);
          (aLeft.material as THREE.MeshStandardMaterial).color.set(posColor);
          (aRight.material as THREE.MeshStandardMaterial).color.set(negColor);
        }
      }
    }

    // Nodal surfaces
    const nodalGroup = modelGroup.getObjectByName('nodal_surface');
    if (nodalGroup) {
      nodalGroup.visible = showNodes && (isAnti || isPi || is2p);
      const transNode = nodalGroup.getObjectByName('transverse_node');
      const longNode = nodalGroup.getObjectByName('longitudinal_node');
      if (transNode) transNode.visible = isAnti;
      if (longNode) longNode.visible = isPi;
    }

    // MO Energy-Level Diagram update
    const energyGroup = modelGroup.getObjectByName('energy_diagram');
    if (energyGroup) {
      energyGroup.visible = showDiagram;
      const sig = `${metrics.orbitalPreset}_${metrics.combinationProgressPct}_${metrics.internuclearDistanceAngstrom}_${metrics.electronOccupancyConfig}`;
      const sprite = createOrUpdateReadoutSprite(
        energyGroup,
        'mo_energy_readout',
        sig,
        [
          { text: `${metrics.orbitalLabel} (${metrics.interactionSymmetry.split(' ')[0]})`, color: '#38BDF8' },
          { text: `Wavefunction: ${metrics.wavefunctionFormula}`, color: '#E2E8F0', font: '18px Inter, sans-serif' },
          {
            text: `E_bonding: ${metrics.bondingOrbitalEnergyEv} eV | E_antibond: ${metrics.antibondingOrbitalEnergyEv} eV (S = ${metrics.overlapIntegralS})`,
            color: '#34D399',
            font: '18px Inter, sans-serif',
          },
          { text: `${metrics.electronConfigurationLabel} | ${metrics.magneticProperty}`, color: '#FBBF24', font: '18px Inter, sans-serif' },
          { text: `Nodes: ${metrics.nodalPlanesCount} (${metrics.nodalPlaneDescription.slice(0, 48)})`, color: '#F8FAFC', font: '17px Inter, sans-serif' },
        ],
        640,
        240,
        [4.3, 1.65, 1]
      );
      sprite.position.set(0, 0.0, 0.25);
    }

    return true;
  }

  // ============================================================================
  // MODEL 70: ATOMIC ORBITAL PROBABILITY EXPLORER
  // ============================================================================
  if (modelId === 'atomic-orbital-probability-explorer') {
    const metrics = calculateAtomicOrbitalMetrics({
      orbitalType: p.orbitalType,
      orbitalOrientation: p.orbitalOrientation,
      probabilityThresholdPct: p.probabilityThresholdPct,
      densityViewMode: p.densityViewMode,
      showNodalSurfaces: p.showNodalSurfaces,
      crossSectionSlice: p.crossSectionSlice,
    });

    const showNodes = (p.showNodalSurfaces ?? 1) >= 0.5;
    const isSliced = (p.crossSectionSlice ?? 0) >= 0.5;
    const threshScale = 0.65 + ((metrics.probabilityThresholdPct - 50) / 45) * 0.48;
    const pulse = 1 + 0.02 * Math.sin(t * 2.2);

    const isoGroup = modelGroup.getObjectByName('probability_isosurface');
    const cloudGroup = modelGroup.getObjectByName('probability_cloud');
    const radialNode = modelGroup.getObjectByName('radial_node_sphere');
    const angularNode = modelGroup.getObjectByName('angular_node_plane');

    if (isoGroup) {
      isoGroup.visible = metrics.densityViewMode === 'isosurface' || metrics.densityViewMode === 'both';
      const sOuterFull = isoGroup.getObjectByName('s_outer_full') as THREE.Mesh | undefined;
      const sOuterHalf = isoGroup.getObjectByName('s_outer_half') as THREE.Mesh | undefined;
      const sInnerCore = isoGroup.getObjectByName('s_inner_core') as THREE.Mesh | undefined;
      const pLobes = isoGroup.getObjectByName('p_lobes_group');
      const dz2 = isoGroup.getObjectByName('dz2_group');
      const dClover = isoGroup.getObjectByName('d_clover_group');

      if (sOuterFull && sOuterHalf && sInnerCore && pLobes && dz2 && dClover) {
        sOuterFull.visible = false;
        sOuterHalf.visible = false;
        sInnerCore.visible = false;
        pLobes.visible = false;
        dz2.visible = false;
        dClover.visible = false;

        if (metrics.orbitalType === '1s') {
          if (isSliced) {
            sOuterHalf.visible = true;
            sOuterHalf.scale.setScalar(0.85 * threshScale * pulse);
            (sOuterHalf.material as THREE.MeshStandardMaterial).color.set('#38BDF8');
          } else {
            sOuterFull.visible = true;
            sOuterFull.scale.setScalar(0.85 * threshScale * pulse);
          }
        } else if (metrics.orbitalType === '2s') {
          sInnerCore.visible = true;
          sInnerCore.scale.setScalar(0.85 * pulse);
          if (isSliced) {
            sOuterHalf.visible = true;
            sOuterHalf.scale.setScalar(1.18 * threshScale * pulse);
            (sOuterHalf.material as THREE.MeshStandardMaterial).color.set('#F43F5E');
          } else {
            sOuterFull.visible = true;
            sOuterFull.scale.setScalar(1.18 * threshScale * pulse);
          }
        } else if (metrics.orbitalType === '2p') {
          pLobes.visible = true;
          pLobes.scale.setScalar(threshScale * pulse * (isSliced ? 0.92 : 1.0));
          pLobes.rotation.set(0, 0, 0);
          if (metrics.orbitalOrientation === 'x') pLobes.rotation.z = -Math.PI / 2;
          else if (metrics.orbitalOrientation === 'z') pLobes.rotation.x = Math.PI / 2;
        } else if (metrics.orbitalType === '3d') {
          if (metrics.orbitalOrientation === 'x2_y2' || metrics.orbitalOrientation === 'xy') {
            dClover.visible = true;
            dClover.scale.setScalar(threshScale * pulse);
            dClover.rotation.set(0, 0, metrics.orbitalOrientation === 'xy' ? Math.PI / 4 : 0);
          } else {
            dz2.visible = true;
            dz2.scale.setScalar(threshScale * pulse);
          }
        }
      }
    }

    if (cloudGroup) {
      cloudGroup.visible = metrics.densityViewMode === 'point_cloud' || metrics.densityViewMode === 'both';
      cloudGroup.rotation.y = t * 0.18;
      cloudGroup.scale.setScalar(threshScale);
    }

    if (radialNode) {
      // Radial nodes = n - l - 1 (equals 1 only for 2s in this set)
      radialNode.visible = showNodes && metrics.radialNodesCount > 0;
    }

    if (angularNode) {
      angularNode.visible = showNodes && metrics.angularNodesCount > 0;
      const p1 = angularNode.getObjectByName('ang_plane_1');
      const p2 = angularNode.getObjectByName('ang_plane_2');
      const cTop = angularNode.getObjectByName('ang_cone_top');
      const cBot = angularNode.getObjectByName('ang_cone_bot');
      if (p1 && p2 && cTop && cBot) {
        p1.visible = false;
        p2.visible = false;
        cTop.visible = false;
        cBot.visible = false;
        angularNode.rotation.set(0, 0, 0);

        if (metrics.orbitalType === '2p') {
          p1.visible = true;
          if (metrics.orbitalOrientation === 'x') angularNode.rotation.z = Math.PI / 2;
          else if (metrics.orbitalOrientation === 'z') angularNode.rotation.x = Math.PI / 2;
        } else if (metrics.orbitalType === '3d') {
          if (metrics.orbitalOrientation === 'x2_y2' || metrics.orbitalOrientation === 'xy') {
            p1.visible = true;
            p2.visible = true;
            angularNode.rotation.z = metrics.orbitalOrientation === 'x2_y2' ? Math.PI / 4 : 0;
          } else {
            cTop.visible = true;
            cBot.visible = true;
          }
        }
      }
    }

    // Floating Quantum Numbers & Node Count Readout
    const axesGroup = modelGroup.getObjectByName('coordinate_axes');
    if (axesGroup) {
      const sig = `${metrics.standardOrbitalName}_${metrics.probabilityThresholdPct}_${metrics.densityViewMode}`;
      const sprite = createOrUpdateReadoutSprite(
        axesGroup,
        'ao_quantum_readout',
        sig,
        [
          {
            text: `${metrics.standardOrbitalName} | Quantum Numbers: n = ${metrics.principalQuantumNumberN}, l = ${metrics.angularMomentumQuantumNumberL}, m_l = ${metrics.magneticQuantumNumberMlLabel}`,
            color: '#38BDF8',
          },
          {
            text: `Radial Nodes (n−l−1) = ${metrics.radialNodesCount} | Angular Nodes (l) = ${metrics.angularNodesCount} | Total Nodes (n−1) = ${metrics.totalNodesCount}`,
            color: '#FBBF24',
            font: '19px Inter, sans-serif',
          },
          {
            text: `Isosurface Enclosure: ${metrics.probabilityThresholdPct}% of ∫|ψ|²dV (Most probable r_max ≈ ${metrics.mostProbableRadiusBohr} a₀)`,
            color: '#34D399',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Quantum Rule: |ψ|² is a statistical probability distribution, NOT a classical electron track.`,
            color: '#E2E8F0',
            font: '17px Inter, sans-serif',
          },
        ],
        660,
        210,
        [4.5, 1.45, 1]
      );
      sprite.position.set(0, 3.25, -1.6);
    }

    return true;
  }

  // ============================================================================
  // MODEL 71: ADVANCED CRYSTAL LATTICE EXPLORER
  // ============================================================================
  if (modelId === 'advanced-crystal-lattice-explorer') {
    const metrics = calculateCrystalLatticeMetrics({
      latticeType: p.latticeType,
      atomicRadiusPm: p.atomicRadiusPm,
      packingViewMode: p.packingViewMode,
      cellExpansionFactor: p.cellExpansionFactor,
      comparisonLatticeType: p.comparisonLatticeType,
    });

    const showWire = (p.showUnitCellWireframe ?? 1) >= 0.5;
    const showLabels = (p.showPositionLabels ?? 1) >= 0.5;
    const showCoord = (p.highlightNearestNeighbours ?? 1) >= 0.5;
    const isSpaceFilling = metrics.packingViewMode === 'space_filling';
    const rRatio = metrics.atomicRadiusPm / 140;
    const expDist = (metrics.cellExpansionFactor / 100) * 1.15;

    // Sphere scale in ball-and-stick vs true touching hard-sphere contact mode
    const sphereScale = isSpaceFilling
      ? (metrics.latticeType === 'SC' ? 3.55 : metrics.latticeType === 'BCC' ? 3.05 : 2.52) * rRatio
      : 1.0 * rRatio;

    const frameGroup = modelGroup.getObjectByName('unit_cell_frame');
    if (frameGroup) {
      frameGroup.visible = showWire;
      const cubicWire = frameGroup.getObjectByName('cubic_wire_main');
      const hexWire = frameGroup.getObjectByName('hex_wire_main');
      const subCells = frameGroup.getObjectByName('expanded_subcells_group');
      if (cubicWire) cubicWire.visible = metrics.latticeType !== 'HCP';
      if (hexWire) hexWire.visible = metrics.latticeType === 'HCP';
      if (subCells) {
        subCells.visible = metrics.cellExpansionFactor > 2 && metrics.latticeType !== 'HCP';
        subCells.children.forEach((child) => {
          const signs = child.userData.octantSigns as [number, number, number] | undefined;
          if (signs) {
            const offset = 0.75 + expDist;
            child.position.set(signs[0] * offset, signs[1] * offset, signs[2] * offset);
          }
        });
      }
    }

    // Corner atoms
    const cornerGroup = modelGroup.getObjectByName('corner_atoms');
    if (cornerGroup) {
      const cubicSub = cornerGroup.getObjectByName('cubic_corners_sub');
      const hcpSub = cornerGroup.getObjectByName('hcp_corners_sub');
      if (cubicSub && hcpSub) {
        cubicSub.visible = metrics.latticeType !== 'HCP';
        hcpSub.visible = metrics.latticeType === 'HCP';

        cubicSub.children.forEach((c) => {
          if (c.name === 'corner_frac_badge') {
            c.visible = showLabels;
          } else {
            c.scale.setScalar(sphereScale);
            const s = c.userData.baseSign as [number, number, number] | undefined;
            if (s) {
              const d = 1.5 + expDist;
              c.position.set(s[0] * d, s[1] * d, s[2] * d);
            }
          }
        });

        hcpSub.children.forEach((c) => {
          if (c.name === 'hcp_corner_badge') {
            c.visible = showLabels;
          } else {
            c.scale.setScalar(sphereScale * 0.9);
            const s = c.userData.baseSign as [number, number, number] | undefined;
            if (s) {
              c.position.set(s[0] * (1.9 + expDist), s[1] * (1.55 + expDist * 0.8), s[2] * (1.9 + expDist));
            }
          }
        });
      }
    }

    // Face-centered atoms
    const faceGroup = modelGroup.getObjectByName('face_center_atoms');
    if (faceGroup) {
      faceGroup.visible = metrics.latticeType === 'FCC' || metrics.latticeType === 'HCP';
      const fccSub = faceGroup.getObjectByName('fcc_faces_sub');
      const hcpBasal = faceGroup.getObjectByName('hcp_basal_sub');
      if (fccSub && hcpBasal) {
        fccSub.visible = metrics.latticeType === 'FCC';
        hcpBasal.visible = metrics.latticeType === 'HCP';
        fccSub.children.forEach((c) => {
          if (c.name === 'face_frac_badge') {
            c.visible = showLabels;
          } else {
            c.scale.setScalar(sphereScale);
            const s = c.userData.baseSign as [number, number, number] | undefined;
            if (s) {
              const d = 1.5 + expDist;
              c.position.set(s[0] * d, s[1] * d, s[2] * d);
            }
          }
        });
        hcpBasal.children.forEach((c) => {
          c.scale.setScalar(sphereScale * 0.9);
          const s = c.userData.baseSign as [number, number, number] | undefined;
          if (s) c.position.set(0, s[1] * (1.55 + expDist * 0.8), 0);
        });
      }
    }

    // Body-centered / Interior atoms
    const bodyGroup = modelGroup.getObjectByName('body_interior_atoms');
    if (bodyGroup) {
      bodyGroup.visible = metrics.latticeType === 'BCC' || metrics.latticeType === 'HCP';
      const bccAtom = bodyGroup.getObjectByName('bcc_body_atom');
      const bodyBadge = bodyGroup.getObjectByName('body_frac_badge');
      const hcpMid = bodyGroup.getObjectByName('hcp_mid_sub');
      if (bccAtom) {
        bccAtom.visible = metrics.latticeType === 'BCC';
        bccAtom.scale.setScalar(sphereScale);
      }
      if (bodyBadge) bodyBadge.visible = showLabels && (metrics.latticeType === 'BCC' || metrics.latticeType === 'HCP');
      if (hcpMid) {
        hcpMid.visible = metrics.latticeType === 'HCP';
        hcpMid.children.forEach((c) => c.scale.setScalar(sphereScale * 0.9));
      }
    }

    // Nearest-Neighbour Coordination Shell
    const coordGroup = modelGroup.getObjectByName('coordination_polyhedron');
    if (coordGroup) {
      coordGroup.visible = showCoord && expDist < 0.25;
      const bccStruts = coordGroup.getObjectByName('bcc_coord_struts');
      const fccStruts = coordGroup.getObjectByName('fcc_coord_struts');
      const scStruts = coordGroup.getObjectByName('sc_coord_struts');
      if (bccStruts) bccStruts.visible = metrics.latticeType === 'BCC';
      if (fccStruts) fccStruts.visible = metrics.latticeType === 'FCC' || metrics.latticeType === 'HCP';
      if (scStruts) scStruts.visible = metrics.latticeType === 'SC';
    }

    // Side-by-side comparison mode
    const compCell = modelGroup.getObjectByName('comparison_lattice_cell');
    if (compCell) {
      const hasComp = metrics.comparisonLatticeType !== 'none';
      compCell.visible = hasComp;
      modelGroup.position.x = hasComp ? -1.8 : 0;
      const compCenter = compCell.getObjectByName('comp_center_atom');
      if (compCenter) compCenter.visible = metrics.comparisonLatticeType === 'BCC' || metrics.comparisonLatticeType === 'HCP';
    }

    // Crystallography Readout Board
    if (frameGroup) {
      const sig = `${metrics.latticeType}_${metrics.atomicRadiusPm}_${metrics.packingViewMode}_${metrics.comparisonLatticeType}`;
      const sprite = createOrUpdateReadoutSprite(
        frameGroup,
        'crystal_metrics_readout',
        sig,
        [
          {
            text: `${metrics.latticeName} | Atoms/Cell = ${metrics.totalAtomsPerConventionalCell} | CN = ${metrics.coordinationNumber}`,
            color: '#38BDF8',
          },
          {
            text: `Sharing: ${metrics.sharingEquation}`,
            color: '#34D399',
            font: '19px Inter, sans-serif',
          },
          {
            text: `APF = ${metrics.atomicPackingFactorPct}% | r = ${metrics.atomicRadiusPm} pm ➔ a = ${metrics.latticeConstantAPm} pm (V = ${metrics.unitCellVolumeNm3} nm³)`,
            color: '#FBBF24',
            font: '18px Inter, sans-serif',
          },
          {
            text: `${metrics.latticeVsBasisNote.slice(0, 74)}...`,
            color: '#E2E8F0',
            font: '16px Inter, sans-serif',
          },
        ],
        660,
        215,
        [4.5, 1.48, 1]
      );
      sprite.position.set(0, 3.05, -1.2);
    }

    return true;
  }

  // ============================================================================
  // MODEL 72: MOLECULAR POLARITY EXPLORER
  // ============================================================================
  if (modelId === 'molecular-polarity-explorer') {
    const metrics = calculateMolecularPolarityMetrics({
      moleculeId: p.moleculeId,
      showBondDipoles: p.showBondDipoles,
      showResultantDipole: p.showResultantDipole,
      showPartialCharges: p.showPartialCharges,
      showGeometryOverlay: p.showGeometryOverlay,
    });

    const showBondDip = (p.showBondDipoles ?? 1) >= 0.5;
    const showResDip = (p.showResultantDipole ?? 1) >= 0.5;
    const showCharges = (p.showPartialCharges ?? 1) >= 0.5;
    const showGeom = (p.showGeometryOverlay ?? 1) >= 0.5;

    // Define 3D coordinates of terminal atoms for each molecule around Central Atom at (0,0,0)
    const d = 1.65;
    let termCoords: [number, number, number][] = [];
    let centralColor = '#EF4444';
    let termColor = '#F8FAFC';
    let bondPointsTowardCentral = true; // true if central atom is δ⁻ (H2O, NH3, CH4); false if terminal is δ⁻ (CO2, BF3)

    if (metrics.moleculeId === 'H2O') {
      const halfAng = (104.5 * Math.PI) / 360;
      termCoords = [
        [d * Math.sin(halfAng), -d * Math.cos(halfAng), 0],
        [-d * Math.sin(halfAng), -d * Math.cos(halfAng), 0],
      ];
      centralColor = '#EF4444'; // O
      termColor = '#F8FAFC'; // H
      bondPointsTowardCentral = true;
    } else if (metrics.moleculeId === 'CO2') {
      termCoords = [
        [-d * 1.1, 0, 0],
        [d * 1.1, 0, 0],
      ];
      centralColor = '#475569'; // C
      termColor = '#EF4444'; // O
      bondPointsTowardCentral = false;
    } else if (metrics.moleculeId === 'NH3') {
      const rHoriz = d * 0.94;
      const yDrop = -d * 0.34;
      termCoords = [
        [rHoriz, yDrop, 0],
        [-rHoriz * 0.5, yDrop, rHoriz * 0.866],
        [-rHoriz * 0.5, yDrop, -rHoriz * 0.866],
      ];
      centralColor = '#3B82F6'; // N
      termColor = '#F8FAFC'; // H
      bondPointsTowardCentral = true;
    } else if (metrics.moleculeId === 'CH4') {
      const s = d / Math.sqrt(3);
      termCoords = [
        [s, s, s],
        [s, -s, -s],
        [-s, s, -s],
        [-s, -s, s],
      ];
      centralColor = '#475569'; // C
      termColor = '#F8FAFC'; // H
      bondPointsTowardCentral = true;
    } else if (metrics.moleculeId === 'BF3') {
      termCoords = [
        [0, d * 1.05, 0],
        [d * 1.05 * 0.866, -d * 1.05 * 0.5, 0],
        [-d * 1.05 * 0.866, -d * 1.05 * 0.5, 0],
      ];
      centralColor = '#F472B6'; // B
      termColor = '#84CC16'; // F
      bondPointsTowardCentral = false;
    }

    const centralMesh = modelGroup.getObjectByName('central_atom_mesh') as THREE.Mesh | undefined;
    if (centralMesh) {
      (centralMesh.material as THREE.MeshStandardMaterial).color.set(centralColor);
    }

    const termGroup = modelGroup.getObjectByName('terminal_atoms');
    const bondsGroup = modelGroup.getObjectByName('covalent_bonds');
    const bondDipGroup = modelGroup.getObjectByName('bond_dipole_vectors');
    const chargeGroup = modelGroup.getObjectByName('partial_charge_markers');

    for (let i = 0; i < 4; i++) {
      const active = i < termCoords.length;
      const tMesh = termGroup?.getObjectByName(`term_atom_${i}`) as THREE.Mesh | undefined;
      const bMesh = bondsGroup?.getObjectByName(`bond_cyl_${i}`) as THREE.Mesh | undefined;
      const dipArrow = bondDipGroup?.getObjectByName(`bond_dipole_${i}`);
      const cBadge = chargeGroup?.getObjectByName(`term_charge_badge_${i}`);

      if (tMesh) {
        tMesh.visible = active;
        if (active) {
          tMesh.position.set(termCoords[i][0], termCoords[i][1], termCoords[i][2]);
          (tMesh.material as THREE.MeshStandardMaterial).color.set(termColor);
        }
      }

      if (bMesh) {
        bMesh.visible = active;
        if (active) {
          const target = new THREE.Vector3(termCoords[i][0], termCoords[i][1], termCoords[i][2]);
          bMesh.position.copy(target.clone().multiplyScalar(0.5));
          bMesh.scale.set(1, target.length(), 1);
          bMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().normalize());
        }
      }

      if (dipArrow) {
        dipArrow.visible = active && showBondDip;
        if (active) {
          const target = new THREE.Vector3(termCoords[i][0], termCoords[i][1], termCoords[i][2]);
          const dir = bondPointsTowardCentral ? target.clone().negate().normalize() : target.clone().normalize();
          dipArrow.position.copy(target.clone().multiplyScalar(0.55)).add(new THREE.Vector3(0, 0, 0.38));
          dipArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        }
      }

      if (cBadge) {
        cBadge.visible = active && showCharges;
        if (active) {
          cBadge.position.set(termCoords[i][0] * 1.32, termCoords[i][1] * 1.32, termCoords[i][2] * 1.32);
        }
      }
    }

    // Lone pairs on H2O (2) and NH3 (1)
    if (chargeGroup) {
      const centralBadge = chargeGroup.getObjectByName('central_charge_badge');
      if (centralBadge) centralBadge.visible = showCharges;
      const lp1 = chargeGroup.getObjectByName('lone_pair_1');
      const lp2 = chargeGroup.getObjectByName('lone_pair_2');
      if (lp1 && lp2) {
        lp1.visible = showGeom && (metrics.moleculeId === 'H2O' || metrics.moleculeId === 'NH3');
        lp2.visible = showGeom && metrics.moleculeId === 'H2O';
        if (metrics.moleculeId === 'H2O') {
          lp1.position.set(0, 0.72, 0.55);
          lp2.position.set(0, 0.72, -0.55);
        } else if (metrics.moleculeId === 'NH3') {
          lp1.position.set(0, 0.92, 0);
        }
      }
    }

    // Resultant Molecular Dipole Vector
    const resDipGroup = modelGroup.getObjectByName('resultant_dipole_vector');
    if (resDipGroup) {
      resDipGroup.visible = showResDip;
      const resArrow = resDipGroup.getObjectByName('res_arrow_sub');
      const zeroRing = resDipGroup.getObjectByName('zero_dipole_ring');
      if (resArrow && zeroRing) {
        resArrow.visible = metrics.isPolarMolecule;
        zeroRing.visible = !metrics.isPolarMolecule;
        resArrow.position.set(0, 0.2, 0.78);
        resArrow.scale.setScalar(metrics.moleculeId === 'H2O' ? 1.0 : 0.85);
      }
    }

    const arcGroup = modelGroup.getObjectByName('geometry_angle_arc');
    if (arcGroup) arcGroup.visible = showGeom;

    // Polarity & Vector Addition Readout Board
    const centralGroup = modelGroup.getObjectByName('central_atom');
    if (centralGroup) {
      const sig = `${metrics.moleculeId}_${showBondDip}_${showResDip}`;
      const sprite = createOrUpdateReadoutSprite(
        centralGroup,
        'polarity_metrics_readout',
        sig,
        [
          {
            text: `${metrics.moleculeName} (${metrics.formula}) | ${metrics.vseprGeometry} (${metrics.idealBondAngleDeg}°)`,
            color: '#38BDF8',
          },
          {
            text: `Electronegativity: ${metrics.centralAtomSymbol} (${metrics.centralElectronegativity}) vs ${metrics.terminalAtomSymbol} (${metrics.terminalElectronegativity}) ➔ Δχ = ${metrics.electronegativityDifference} (${metrics.bondPolarityClassification.split(' ')[0]})`,
            color: '#E2E8F0',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Overall Classification: ${metrics.overallPolarityClassification} | Net Dipole μ_net = ${metrics.netDipoleMomentDebye} D`,
            color: metrics.isPolarMolecule ? '#FBBF24' : '#34D399',
            font: '20px Inter, sans-serif',
          },
          {
            text: `Dipole Convention: +—▸ points from ${metrics.centralPartialCharge.includes('+') ? 'Central δ⁺' : 'Terminal δ⁺'} toward ${metrics.centralPartialCharge.includes('−') ? 'Central δ⁻' : 'Terminal δ⁻'}`,
            color: '#F8FAFC',
            font: '17px Inter, sans-serif',
          },
        ],
        660,
        215,
        [4.5, 1.48, 1]
      );
      sprite.position.set(0, 2.75, -1.2);
    }

    return true;
  }

  // ============================================================================
  // MODEL 73: INTERMOLECULAR FORCES EXPLORER
  // ============================================================================
  if (modelId === 'intermolecular-forces-explorer') {
    const metrics = calculateIntermolecularForcesMetrics({
      interactionType: p.interactionType,
      separationAngstrom: p.separationAngstrom,
      relativeOrientationDeg: p.relativeOrientationDeg,
      thermalMotionLevel: p.thermalMotionLevel,
      showComparisonSystem: p.showComparisonSystem,
    });

    const showOverlay = (p.showInteractionOverlay ?? 1) >= 0.5;
    const showComp = (p.showComparisonSystem ?? 0) >= 0.5;

    // Thermal agitation jitter proportional to T
    const jitterAmp = (metrics.thermalTemperatureK / 300) * 0.055;
    const jx = Math.sin(t * 6.5) * jitterAmp;
    const jy = Math.cos(t * 5.2) * jitterAmp;

    const halfDist = metrics.separationAngstrom * 0.48;
    const mol1 = modelGroup.getObjectByName('molecule_1');
    const mol2 = modelGroup.getObjectByName('molecule_2');

    const configureMoleculeAppearance = (rig: THREE.Object3D | undefined, prefix: string) => {
      if (!rig) return;
      const core = rig.getObjectByName(`${prefix}_core`) as THREE.Mesh | undefined;
      const sub1 = rig.getObjectByName(`${prefix}_sub1`) as THREE.Mesh | undefined;
      const sub2 = rig.getObjectByName(`${prefix}_sub2`) as THREE.Mesh | undefined;
      const bond1 = rig.getObjectByName(`${prefix}_bond1`) as THREE.Mesh | undefined;
      const bond2 = rig.getObjectByName(`${prefix}_bond2`) as THREE.Mesh | undefined;
      const bNeg = rig.getObjectByName(`${prefix}_badge_neg`);
      const bPos = rig.getObjectByName(`${prefix}_badge_pos`);

      if (!core || !sub1 || !sub2 || !bond1 || !bond2) return;

      if (metrics.interactionId === 'hydrogen_bonding_h2o') {
        (core.material as THREE.MeshStandardMaterial).color.set('#EF4444'); // O
        core.scale.setScalar(1.0);
        sub1.visible = true;
        sub2.visible = true;
        bond1.visible = true;
        bond2.visible = true;
        sub1.position.set(0.68, 0.35, 0);
        sub2.position.set(-0.35, -0.68, 0);
        bond1.position.set(0.34, 0.17, 0);
        bond1.rotation.z = -1.1;
        bond2.position.set(-0.17, -0.34, 0);
        bond2.rotation.z = -0.45;
      } else if (metrics.interactionId === 'dipole_dipole_hcl') {
        (core.material as THREE.MeshStandardMaterial).color.set('#22C55E'); // Cl
        core.scale.setScalar(1.12);
        sub1.visible = true;
        sub2.visible = false;
        bond1.visible = true;
        bond2.visible = false;
        sub1.position.set(0.82, 0, 0);
        bond1.position.set(0.41, 0, 0);
        bond1.rotation.z = Math.PI / 2;
      } else if (metrics.interactionId === 'dispersion_ar2') {
        (core.material as THREE.MeshStandardMaterial).color.set('#06B6D4'); // Ar
        core.scale.setScalar(1.22);
        sub1.visible = false;
        sub2.visible = false;
        bond1.visible = false;
        bond2.visible = false;
      } else {
        // I2 dimer
        (core.material as THREE.MeshStandardMaterial).color.set('#9333EA'); // I
        core.scale.setScalar(1.18);
        sub1.visible = true;
        (sub1.material as THREE.MeshStandardMaterial).color.set('#9333EA');
        sub1.scale.setScalar(1.6);
        sub1.position.set(-0.78, 0, 0);
        sub2.visible = false;
        bond1.visible = true;
        bond1.position.set(-0.39, 0, 0);
        bond1.rotation.z = Math.PI / 2;
        bond2.visible = false;
      }

      if (bNeg) bNeg.visible = showOverlay;
      if (bPos) bPos.visible = showOverlay;
    };

    configureMoleculeAppearance(mol1, 'mol1');
    configureMoleculeAppearance(mol2, 'mol2');

    if (mol1) {
      mol1.position.set(-halfDist + jx, jy, 0);
    }
    if (mol2) {
      mol2.position.set(halfDist - jx, -jy, 0);
      mol2.rotation.z = (metrics.relativeOrientationDeg * Math.PI) / 180;
    }

    // Dashed non-covalent attraction overlay
    const imfOverlay = modelGroup.getObjectByName('imf_attraction_overlay');
    if (imfOverlay) {
      imfOverlay.visible = showOverlay;
      const isRepulsive = metrics.attractionStatus !== 'Strong Attraction';
      const dashColor = isRepulsive ? '#F43F5E' : '#10B981';
      for (let i = 0; i < 9; i++) {
        const bead = imfOverlay.getObjectByName(`imf_dash_${i}`) as THREE.Mesh | undefined;
        if (bead) {
          const frac = (i + 0.5) / 9;
          bead.position.set(-halfDist * 0.65 + frac * (halfDist * 1.3), 0, 0);
          (bead.material as THREE.MeshStandardMaterial).color.set(dashColor);
        }
      }
    }

    // Polarizable Electron Cloud Hull
    const hullGroup = modelGroup.getObjectByName('electron_cloud_hull');
    if (hullGroup) {
      hullGroup.visible = showOverlay;
      const h1 = hullGroup.getObjectByName('hull_1');
      const h2 = hullGroup.getObjectByName('hull_2');
      const osc = 1 + 0.08 * Math.sin(t * 3.5);
      if (h1) {
        h1.position.set(-halfDist + jx, jy, 0);
        h1.scale.set(1.25 * osc, 0.95, 0.95);
      }
      if (h2) {
        h2.position.set(halfDist - jx, -jy, 0);
        h2.scale.set(1.25 * osc, 0.95, 0.95);
      }
    }

    // Potential Energy Well Indicator
    const wellGroup = modelGroup.getObjectByName('energy_well_curve');
    if (wellGroup) {
      const marker = wellGroup.getObjectByName('lj_live_marker');
      if (marker) {
        const xNorm = ((metrics.separationAngstrom - 2.3) / 4.2) * 3.8 - 1.9;
        const yNorm = Math.max(-0.55, Math.min(0.55, metrics.potentialEnergyKjMol / 25));
        marker.position.set(xNorm, yNorm, 0.12);
      }
      const sig = `${metrics.interactionId}_${metrics.separationAngstrom}_${metrics.relativeOrientationDeg}_${metrics.thermalTemperatureK}`;
      const sprite = createOrUpdateReadoutSprite(
        wellGroup,
        'imf_metrics_readout',
        sig,
        [
          {
            text: `${metrics.systemTitle} | Primary IMF: ${metrics.primaryForceName}`,
            color: '#38BDF8',
          },
          {
            text: `Separation r = ${metrics.separationAngstrom} Å (r_eq = ${metrics.equilibriumSeparationAngstrom} Å) | Orientation θ = ${metrics.relativeOrientationDeg}°`,
            color: '#E2E8F0',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Pair Potential V(r,θ) = ${metrics.potentialEnergyKjMol} kJ/mol (${metrics.attractionStatus}) | Normal BP = ${metrics.normalBoilingPointC}°C`,
            color: metrics.potentialEnergyKjMol < 0 ? '#34D399' : '#F43F5E',
            font: '19px Inter, sans-serif',
          },
          {
            text: `Universal Rule: London Dispersion (α = ${metrics.polarizabilityVolumeAngstrom3} Å³) acts in ALL molecules alongside dipoles.`,
            color: '#FBBF24',
            font: '17px Inter, sans-serif',
          },
        ],
        660,
        210,
        [4.5, 1.42, 1]
      );
      sprite.position.set(0, 0.0, 0.22);
    }

    const compGroup = modelGroup.getObjectByName('comparison_dimer_pair');
    if (compGroup) {
      compGroup.visible = showComp;
      if (showComp) {
        const sprite = createOrUpdateReadoutSprite(
          compGroup,
          'imf_comp_readout',
          metrics.interactionId,
          [
            { text: `Boiling Point & Polarizability Comparison`, color: '#C084FC' },
            { text: `${metrics.comparisonSystemLabel}`, color: '#F8FAFC', font: '18px Inter, sans-serif' },
          ],
          600,
          120,
          [4.1, 0.85, 1]
        );
        sprite.position.set(0, 0, 0.18);
      }
    }

    return true;
  }

  // ============================================================================
  // MODEL 74: ELECTROCHEMICAL CELL SIMULATOR
  // ============================================================================
  if (modelId === 'electrochemical-cell-simulator') {
    const metrics = calculateGalvanicCellMetrics({
      cellPair: p.cellPair,
      anodeConcentrationM: p.anodeConcentrationM,
      cathodeConcentrationM: p.cathodeConcentrationM,
      temperatureKelvin: p.temperatureKelvin,
    });

    const showIons = (p.showIonMovement ?? 1) >= 0.5;
    const showElectrons = (p.showElectronFlow ?? 1) >= 0.5;

    // Update Electrode & Electrolyte scientifically accurate colors based on selected Cell Pair
    const anodePlate = modelGroup.getObjectByName('anode_plate_mesh') as THREE.Mesh | undefined;
    const cathodePlate = modelGroup.getObjectByName('cathode_plate_mesh') as THREE.Mesh | undefined;
    const anodeLiq = modelGroup.getObjectByName('anode_liquid_mesh') as THREE.Mesh | undefined;
    const cathodeLiq = modelGroup.getObjectByName('cathode_liquid_mesh') as THREE.Mesh | undefined;

    if (anodePlate && cathodePlate && anodeLiq && cathodeLiq) {
      if (metrics.cellPairId === 'zn_cu') {
        (anodePlate.material as THREE.MeshStandardMaterial).color.set('#94A3B8'); // Zinc grey
        (cathodePlate.material as THREE.MeshStandardMaterial).color.set('#D97706'); // Copper reddish-brown
        (anodeLiq.material as THREE.MeshStandardMaterial).color.set('#E0F2FE'); // Colourless ZnSO4(aq)
        (anodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.28;
        (cathodeLiq.material as THREE.MeshStandardMaterial).color.set('#0284C7'); // Blue CuSO4(aq)
        (cathodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.35 + Math.min(0.3, metrics.cathodeConcentrationM * 0.15);
      } else if (metrics.cellPairId === 'cu_ag') {
        (anodePlate.material as THREE.MeshStandardMaterial).color.set('#D97706'); // Copper anode
        (cathodePlate.material as THREE.MeshStandardMaterial).color.set('#E2E8F0'); // Silver cathode
        (anodeLiq.material as THREE.MeshStandardMaterial).color.set('#0284C7'); // Blue CuSO4(aq)
        (anodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.35 + Math.min(0.3, metrics.anodeConcentrationM * 0.15);
        (cathodeLiq.material as THREE.MeshStandardMaterial).color.set('#F1F5F9'); // Colourless AgNO3(aq)
        (cathodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.28;
      } else {
        // fe_cu
        (anodePlate.material as THREE.MeshStandardMaterial).color.set('#64748B'); // Iron anode
        (cathodePlate.material as THREE.MeshStandardMaterial).color.set('#D97706'); // Copper cathode
        (anodeLiq.material as THREE.MeshStandardMaterial).color.set('#86EFAC'); // Pale green FeSO4(aq)
        (anodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.38;
        (cathodeLiq.material as THREE.MeshStandardMaterial).color.set('#0284C7'); // Blue CuSO4(aq)
        (cathodeLiq.material as THREE.MeshStandardMaterial).opacity = 0.48;
      }
    }

    // Animate electron flow strictly through the external wire (Anode x=-2.95 -> up -> across y=3.0 -> down to Cathode x=+2.95)
    const eBeadsSub = modelGroup.getObjectByName('external_electrons_sub');
    if (eBeadsSub) {
      eBeadsSub.visible = showElectrons;
      eBeadsSub.children.forEach((bead, idx) => {
        const u = ((t * 0.28 + idx / eBeadsSub.children.length) % 1);
        if (u < 0.2) {
          const f = u / 0.2;
          bead.position.set(-2.95, 1.5 + f * 1.5, 0);
        } else if (u < 0.8) {
          const f = (u - 0.2) / 0.6;
          bead.position.set(-2.95 + f * 5.9, 3.0, 0);
        } else {
          const f = (u - 0.8) / 0.2;
          bead.position.set(2.95, 3.0 - f * 1.5, 0);
        }
      });
    }

    // Animate ion movement inside the salt bridge and half-cells (separate from external electrons)
    const ionsGroup = modelGroup.getObjectByName('electrolyte_ions');
    if (ionsGroup) {
      ionsGroup.visible = showIons;
      ionsGroup.children.forEach((ion, idx) => {
        const phase = (t * 0.35 + idx * 0.17) % 1;
        if (idx < 4) {
          // Salt bridge NO3- migrating left toward Anode
          const ang = phase * Math.PI;
          ion.position.set(1.85 * Math.cos(ang), 0.2 + 1.85 * Math.sin(ang), 0);
        } else if (idx < 8) {
          // Salt bridge K+ migrating right toward Cathode
          const ang = (1 - phase) * Math.PI;
          ion.position.set(1.85 * Math.cos(ang), 0.2 + 1.85 * Math.sin(ang), 0.15);
        } else if (idx < 10) {
          // Anode half-cell cation release
          ion.position.set(-2.9 + phase * 0.85, -0.5 + Math.sin(t * 2 + idx) * 0.35, 0.35);
        } else {
          // Cathode half-cell cation deposition
          ion.position.set(2.1 + phase * 0.8, -0.5 + Math.cos(t * 2 + idx) * 0.35, 0.35);
        }
      });
    }

    // Digital Voltmeter Live Readout
    const meterGroup = modelGroup.getObjectByName('digital_voltmeter');
    if (meterGroup) {
      const sig = `${metrics.cellPairId}_${metrics.anodeConcentrationM}_${metrics.cathodeConcentrationM}_${metrics.temperatureKelvin}`;
      const sprite = createOrUpdateReadoutSprite(
        meterGroup,
        'galvanic_meter_readout',
        sig,
        [
          {
            text: `E_cell (Nernst) = +${metrics.liveNernstPotentialV.toFixed(3)} V | E°_cell = +${metrics.standardCellPotentialV.toFixed(2)} V`,
            color: '#34D399',
          },
          {
            text: `Anode (−): ${metrics.anodeHalfReaction} (E° = ${metrics.anodeStandardPotentialV >= 0 ? '+' : ''}${metrics.anodeStandardPotentialV.toFixed(2)} V)`,
            color: '#38BDF8',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Cathode (+): ${metrics.cathodeHalfReaction} (E° = +${metrics.cathodeStandardPotentialV.toFixed(2)} V)`,
            color: '#FBBF24',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Overall: ${metrics.overallRedoxReaction} | ΔG = ${metrics.gibbsFreeEnergyKjMol} kJ/mol`,
            color: '#F8FAFC',
            font: '18px Inter, sans-serif',
          },
        ],
        680,
        215,
        [4.5, 1.42, 1]
      );
      sprite.position.set(0, 0.95, 0.35);
    }

    return true;
  }

  // ============================================================================
  // MODEL 75: ELECTROLYSIS EXPLORER
  // ============================================================================
  if (modelId === 'electrolysis-explorer') {
    const metrics = calculateElectrolysisMetrics({
      experimentType: p.experimentType,
      currentAmps: p.currentAmps,
      durationSeconds: p.durationSeconds,
    });

    const showIons = (p.showIonMigration ?? 1) >= 0.5;
    const showProducts = (p.showProductFormation ?? 1) >= 0.5;

    // Update Electrolyte bath color for Molten NaCl(l) vs Acidified H2O(l) vs Aqueous CuSO4(aq)
    const bathLiq = modelGroup.getObjectByName('electrolysis_liquid_mesh') as THREE.Mesh | undefined;
    if (bathLiq) {
      const mat = bathLiq.material as THREE.MeshStandardMaterial;
      if (metrics.experimentId === 'molten_nacl') {
        mat.color.set('#F59E0B'); // Glowing amber molten NaCl(l)
        mat.opacity = 0.46;
      } else if (metrics.experimentId === 'water_electrolysis') {
        mat.color.set('#E0F2FE'); // Clear acidified water H2O(l)
        mat.opacity = 0.28;
      } else {
        mat.color.set('#0284C7'); // Blue aqueous CuSO4(aq)
        mat.opacity = 0.52;
      }
    }

    // External DC electrons flow from Positive Anode (+1.45) up into DC Supply and down into Negative Cathode (-1.45)
    const speedFactor = 0.18 + (metrics.currentAmps / 30) * 0.45;
    const dcElectrons = modelGroup.getObjectByName('dc_electrons_sub');
    if (dcElectrons) {
      dcElectrons.children.forEach((eDot, idx) => {
        const u = ((t * speedFactor + idx / dcElectrons.children.length) % 1);
        if (u < 0.25) {
          const f = u / 0.25;
          eDot.position.set(1.45, 1.35 + f * 1.6, 0);
        } else if (u < 0.75) {
          const f = (u - 0.25) / 0.5;
          eDot.position.set(1.45 - f * 2.9, 2.95, 0);
        } else {
          const f = (u - 0.75) / 0.25;
          eDot.position.set(-1.45, 2.95 - f * 1.6, 0);
        }
      });
    }

    // Mobile Cations drift left to Negative Cathode (-1.45); Anions drift right to Positive Anode (+1.45)
    const mobileIons = modelGroup.getObjectByName('mobile_ions_cloud');
    if (mobileIons) {
      mobileIons.visible = showIons;
      mobileIons.children.forEach((ion, idx) => {
        const isCation = idx < 7;
        const prog = ((t * speedFactor * 0.9 + idx * 0.19) % 1);
        const yOff = -1.25 + (idx % 5) * 0.35;
        const zOff = ((idx % 3) - 1) * 0.45;
        if (isCation) {
          ion.position.set(0.8 - prog * 2.05, yOff, zOff);
        } else {
          ion.position.set(-0.8 + prog * 2.05, yOff, zOff);
        }
      });
    }

    // Cathode & Anode Product Formation
    const catProd = modelGroup.getObjectByName('cathode_product_zone');
    const anProd = modelGroup.getObjectByName('anode_product_zone');
    const yieldScale = Math.min(1.65, 0.85 + (metrics.totalChargeCoulombs / 36000) * 0.65);

    if (catProd) {
      catProd.visible = showProducts;
      const sleeve = catProd.getObjectByName('cathode_plating_sleeve') as THREE.Mesh | undefined;
      const catBubbles = catProd.getObjectByName('cathode_bubbles_sub');
      if (sleeve && catBubbles) {
        if (metrics.experimentId === 'water_electrolysis') {
          sleeve.visible = false;
          catBubbles.visible = true;
          catBubbles.children.forEach((bub, idx) => {
            const prog = ((t * (0.45 + speedFactor) + idx * 0.13) % 1);
            const ang = idx * 1.1;
            bub.position.set(-1.45 + Math.cos(ang) * 0.32, -1.35 + prog * 1.85, Math.sin(ang) * 0.32);
            bub.scale.setScalar(0.7 + prog * 0.55);
          });
        } else {
          sleeve.visible = true;
          catBubbles.visible = false;
          sleeve.scale.set(yieldScale, 1.0, yieldScale);
          (sleeve.material as THREE.MeshStandardMaterial).color.set(
            metrics.experimentId === 'molten_nacl' ? '#E2E8F0' : '#D97706'
          );
        }
      }
    }

    if (anProd) {
      anProd.visible = showProducts;
      // In water electrolysis, O2 has z=4 (half as many gas bubbles/volume as H2 with z=2)
      const activeBubbleCount = metrics.experimentId === 'water_electrolysis' ? 7 : 14;
      anProd.children.forEach((bub, idx) => {
        bub.visible = idx < activeBubbleCount;
        const prog = ((t * (0.4 + speedFactor * 0.85) + idx * 0.15) % 1);
        const ang = idx * 1.3;
        bub.position.set(1.45 + Math.cos(ang) * 0.32, -1.35 + prog * 1.85, Math.sin(ang) * 0.32);
        bub.scale.setScalar(0.75 + prog * 0.5);
        ((bub as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(
          metrics.experimentId === 'molten_nacl' ? '#A3E635' : '#F8FAFC'
        );
      });
    }

    // Faraday's Laws & Stoichiometry Readout Board
    const dcSupply = modelGroup.getObjectByName('dc_power_supply');
    if (dcSupply) {
      const sig = `${metrics.experimentId}_${metrics.currentAmps}_${metrics.durationSeconds}`;
      const catYieldStr =
        metrics.cathodeGasVolumeMlStp > 0
          ? `${metrics.cathodeTheoreticalMassG} g (${metrics.cathodeGasVolumeMlStp} mL STP)`
          : `${metrics.cathodeTheoreticalMassG} g plated`;
      const anYieldStr = `${metrics.anodeTheoreticalMassG} g (${metrics.anodeGasVolumeMlStp} mL STP)`;

      const sprite = createOrUpdateReadoutSprite(
        dcSupply,
        'faraday_calc_readout',
        sig,
        [
          {
            text: `${metrics.experimentTitle}`,
            color: '#38BDF8',
          },
          {
            text: `Faraday Law: Q = I·t = ${metrics.currentAmps} A × ${metrics.durationSeconds} s = ${metrics.totalChargeCoulombs} C (${metrics.molesOfElectrons} mol e⁻)`,
            color: '#FBBF24',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Cathode (−): ${metrics.cathodeHalfReaction} ➔ m = ${catYieldStr}`,
            color: '#34D399',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Anode (+): ${metrics.anodeHalfReaction} ➔ m = ${anYieldStr}`,
            color: '#F43F5E',
            font: '18px Inter, sans-serif',
          },
          {
            text: `Overall: ${metrics.overallReaction}`,
            color: '#F8FAFC',
            font: '17px Inter, sans-serif',
          },
        ],
        680,
        235,
        [4.6, 1.55, 1]
      );
      sprite.position.set(0, 1.05, 0.35);
    }

    return true;
  }

  return false;
}

// ============================================================================
// ADAPTER HOOKS FOR DYNAMIC3DMODELRENDERER.TSX
// ============================================================================
const CHEMISTRY_BATCH_1_IDS = new Set([
  'molecular-orbital-explorer',
  'atomic-orbital-probability-explorer',
  'advanced-crystal-lattice-explorer',
  'molecular-polarity-explorer',
  'intermolecular-forces-explorer',
  'electrochemical-cell-simulator',
  'electrolysis-explorer',
]);

export function isChemistryBatch1Model(functionalType?: string, id?: string): boolean {
  return CHEMISTRY_BATCH_1_IDS.has(String(functionalType || '')) || CHEMISTRY_BATCH_1_IDS.has(String(id || ''));
}

export interface ChemistryBatch1SceneHandles {
  modelId: string;
  studioGroup: THREE.Group;
  rootGroup: THREE.Group;
}

export function buildChemistryBatch1CustomAssemblies(
  modelSpec: { id: string; functionalType?: string; parts: any[] },
  modelRoot: THREE.Group,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): ChemistryBatch1SceneHandles {
  const modelId = CHEMISTRY_BATCH_1_IDS.has(modelSpec.id)
    ? modelSpec.id
    : String(modelSpec.functionalType || modelSpec.id);

  // Hide default placeholder proxy meshes created by the generic loop
  modelSpec.parts.forEach((part) => {
    const proxy = meshMap.get(part.id);
    if (proxy) {
      proxy.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
          });
        }
      });
    }
  });

  const studioGroup = new THREE.Group();
  studioGroup.name = `chemistry_batch1_studio_${modelId}`;
  modelRoot.add(studioGroup);

  const createMat: CreateMatFn = (
    color,
    opacity = 1.0,
    metalness = 0.2,
    roughness = 0.3,
    emissive,
    emissiveIntensity = 0.2
  ) => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color as any),
      transparent: opacity < 1.0,
      opacity,
      metalness,
      roughness,
      depthWrite: opacity >= 0.85,
    });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive as any);
      mat.emissiveIntensity = emissiveIntensity;
    }
    return mat;
  };

  const makeGlow: MakeGlowFn = (color, radius = 0.8, intensity = 0.45) => {
    if (typeof document === 'undefined') {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: new THREE.Color(color as any),
          transparent: true,
          opacity: intensity,
          depthWrite: false,
        })
      );
      sprite.scale.set(radius * 2, radius * 2, 1);
      return sprite;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      const col = new THREE.Color(color as any);
      const rgb = `${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)}`;
      grad.addColorStop(0, `rgba(${rgb}, ${intensity})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    sprite.scale.set(radius * 2, radius * 2, 1);
    return sprite;
  };

  const registerPart: RegisterPartFn = (obj, id, name, _baseY = 0, basePos) => {
    obj.name = id;
    const partSpec = modelSpec.parts.find((p) => p.id === id);
    const pos = basePos || (partSpec?.position as [number, number, number]) || [
      obj.position.x,
      obj.position.y,
      obj.position.z,
    ];
    const baseVec = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const explodedVec =
      baseVec.length() > 0.1
        ? baseVec.clone().multiplyScalar(1.55)
        : new THREE.Vector3(0, 1.2, 0);

    obj.userData = {
      ...obj.userData,
      partSpec,
      componentId: id,
      componentName: partSpec?.label || partSpec?.name || name,
      basePosition: baseVec,
      explodedPosition: explodedVec,
      labelAnchor: baseVec.clone(),
    };

    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = {
          ...child.userData,
          partSpec,
          componentId: id,
          componentName: partSpec?.label || partSpec?.name || name,
        };
        interactiveMeshes.push(child);
      }
    });

    meshMap.set(id, obj);
  };

  buildChemistryBatch1Studio(
    modelId,
    studioGroup,
    interactiveMeshes,
    createMat,
    makeGlow,
    registerPart
  );

  return { modelId, studioGroup, rootGroup: studioGroup };
}

export function updateChemistryBatch1CustomAssemblies(
  handles: ChemistryBatch1SceneHandles,
  parameters: Record<string, number>,
  conditions: Record<string, any>,
  simTime: number
): void {
  const combinedParams: Record<string, any> = {
    ...parameters,
    ...conditions,
  };
  // Normalize boolean conditions into 1 / 0 for numeric toggle checks
  for (const [k, v] of Object.entries(conditions)) {
    if (typeof v === 'boolean') {
      combinedParams[k] = v ? 1 : 0;
    }
  }
  animateChemistryBatch1Model(handles.modelId, handles.studioGroup, simTime, combinedParams);
}

