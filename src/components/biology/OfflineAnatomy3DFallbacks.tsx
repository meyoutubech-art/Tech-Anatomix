import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, EyeOff, Sparkles, Heart, WifiOff } from 'lucide-react';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import {
  setupPreBatch1StudioEnvironment,
  styleStudioGridHelper,
} from '../../simulations/preBatch1VisualUpgradeStudio';
import { HUMAN_ORGAN_LIST, HumanOrganInfo } from '../../data/humanAnatomyData';
import { FROG_ORGAN_MANIFEST, FROG_ORGAN_LIST } from '../../data/frogAnatomyData';
import { FrogOrganId } from '../../types/frogAnatomy';

interface OfflineHumanInternalOrgans3DViewerProps {
  onSelectOrgan?: (organ: HumanOrganInfo) => void;
}

export const OfflineHumanInternalOrgans3DViewer: React.FC<
  OfflineHumanInternalOrgans3DViewerProps
> = ({ onSelectOrgan }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const organGroupsRef = useRef<Record<string, THREE.Group>>({});
  const ribcageGroupRef = useRef<THREE.Group | null>(null);

  const [selectedOrganId, setSelectedOrganId] = useState<string>('human_heart');
  const [showRibcage, setShowRibcage] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const selectedOrganIdRef = useRef<string>(selectedOrganId);
  selectedOrganIdRef.current = selectedOrganId;

  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;

  const selectedOrganInfo =
    HUMAN_ORGAN_LIST.find((o) => o.id === selectedOrganId) || HUMAN_ORGAN_LIST[1];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 3.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -1.35, {
      includeStagePlatform: false,
      includeGroundStage: false,
    });

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 1.2,
      maxDistance: 6.5,
    });
    controls.target.set(0, 0.08, 0);
    controls.saveInitialState(new THREE.Vector3(0, 0.25, 3.35), new THREE.Vector3(0, 0.08, 0));
    controlsRef.current = controls;

    // Surgical & Anatomical Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.72);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(6, 18, 0x38bdf8, 0x1e293b);
    styleStudioGridHelper(grid);
    grid.position.y = -1.25;
    scene.add(grid);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const organMap: Record<string, THREE.Group> = {};
    const registerOrganGroup = (id: string, group: THREE.Group) => {
      group.userData = { organId: id };
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = { organId: id };
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      organMap[id] = group;
      rootGroup.add(group);
    };

    // -------------------------------------------------------------------------
    // 0. Translucent Skeletal Reference (Ribcage, Sternum & Spine)
    // -------------------------------------------------------------------------
    const ribcageGroup = new THREE.Group();
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.05,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });

    // Thoracic vertebral column & sternum
    const spineGeo = new THREE.CylinderGeometry(0.055, 0.068, 1.95, 16);
    const spineMesh = new THREE.Mesh(spineGeo, boneMat);
    spineMesh.position.set(0, 0.05, -0.26);
    ribcageGroup.add(spineMesh);

    const sternumGeo = new THREE.BoxGeometry(0.09, 0.46, 0.032);
    const sternumMesh = new THREE.Mesh(sternumGeo, boneMat);
    sternumMesh.position.set(0, 0.44, 0.27);
    ribcageGroup.add(sternumMesh);

    // 8 pairs of curved ribs
    for (let r = 0; r < 8; r++) {
      const yPos = 0.68 - r * 0.072;
      const ribWidth = 0.36 + Math.sin((r / 7) * Math.PI) * 0.14;
      const ribDepth = 0.24 + Math.sin((r / 7) * Math.PI) * 0.05;
      [-1, 1].forEach((side) => {
        const ribCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, yPos + 0.02, -0.24),
          new THREE.Vector3(side * ribWidth * 0.72, yPos, -0.08),
          new THREE.Vector3(side * ribWidth, yPos - 0.02, 0.08),
          new THREE.Vector3(side * 0.05, yPos - 0.035, r < 6 ? 0.26 : 0.16),
        ]);
        const ribGeo = new THREE.TubeGeometry(ribCurve, 20, 0.014, 8, false);
        ribcageGroup.add(new THREE.Mesh(ribGeo, boneMat));
      });
    }
    rootGroup.add(ribcageGroup);
    ribcageGroupRef.current = ribcageGroup;

    // -------------------------------------------------------------------------
    // 1. Cranial Brain & Brainstem (human_brain)
    // -------------------------------------------------------------------------
    const brainGroup = new THREE.Group();
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0x831843,
      emissiveIntensity: 0.18,
      roughness: 0.42,
      metalness: 0.05,
    });
    [-1, 1].forEach((side) => {
      const hemiGeo = new THREE.SphereGeometry(0.16, 24, 24);
      hemiGeo.scale(0.78, 0.88, 1.15);
      const hemi = new THREE.Mesh(hemiGeo, brainMat);
      hemi.position.set(side * 0.095, 1.02, 0.0);
      brainGroup.add(hemi);
    });
    const cerebellumGeo = new THREE.SphereGeometry(0.09, 18, 18);
    cerebellumGeo.scale(1.3, 0.72, 0.85);
    const cerebellum = new THREE.Mesh(cerebellumGeo, brainMat);
    cerebellum.position.set(0, 0.89, -0.11);
    brainGroup.add(cerebellum);

    const brainstemGeo = new THREE.CylinderGeometry(0.034, 0.024, 0.22, 12);
    const brainstem = new THREE.Mesh(brainstemGeo, brainMat);
    brainstem.position.set(0, 0.78, -0.06);
    brainGroup.add(brainstem);
    registerOrganGroup('human_brain', brainGroup);

    // -------------------------------------------------------------------------
    // 2. Paired Lobar Lungs & Tracheobronchial Tree (human_lungs)
    // -------------------------------------------------------------------------
    const lungsGroup = new THREE.Group();
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0x4c0519,
      emissiveIntensity: 0.16,
      roughness: 0.46,
      metalness: 0.04,
    });
    const tracheaMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
      roughness: 0.35,
    });

    // Cartilaginous Trachea & Primary Bronchi
    const tracheaGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.32, 16);
    const tracheaMesh = new THREE.Mesh(tracheaGeo, tracheaMat);
    tracheaMesh.position.set(0, 0.66, 0.0);
    lungsGroup.add(tracheaMesh);

    for (let ring = 0; ring < 7; ring++) {
      const cRingGeo = new THREE.TorusGeometry(0.034, 0.0045, 8, 20);
      cRingGeo.rotateX(Math.PI / 2);
      const cRing = new THREE.Mesh(cRingGeo, tracheaMat);
      cRing.position.set(0, 0.54 + ring * 0.038, 0.0);
      lungsGroup.add(cRing);
    }

    // Right Lung (3 lobes: superior, middle, inferior) — anatomical right is viewer's left (-X)
    const rightUpperGeo = new THREE.SphereGeometry(0.16, 24, 24);
    rightUpperGeo.scale(0.88, 1.15, 0.85);
    const rightUpper = new THREE.Mesh(rightUpperGeo, lungMat);
    rightUpper.position.set(-0.21, 0.49, 0.01);
    lungsGroup.add(rightUpper);

    const rightLowerGeo = new THREE.SphereGeometry(0.175, 24, 24);
    rightLowerGeo.scale(0.95, 1.1, 0.88);
    const rightLower = new THREE.Mesh(rightLowerGeo, lungMat);
    rightLower.position.set(-0.22, 0.31, 0.0);
    lungsGroup.add(rightLower);

    // Left Lung (2 lobes with cardiac notch) — anatomical left is viewer's right (+X)
    const leftUpperGeo = new THREE.SphereGeometry(0.155, 24, 24);
    leftUpperGeo.scale(0.84, 1.15, 0.85);
    const leftUpper = new THREE.Mesh(leftUpperGeo, lungMat);
    leftUpper.position.set(0.21, 0.49, 0.01);
    lungsGroup.add(leftUpper);

    const leftLowerGeo = new THREE.SphereGeometry(0.165, 24, 24);
    leftLowerGeo.scale(0.88, 1.08, 0.86);
    const leftLower = new THREE.Mesh(leftLowerGeo, lungMat);
    leftLower.position.set(0.22, 0.30, 0.0);
    lungsGroup.add(leftLower);

    registerOrganGroup('human_lungs', lungsGroup);

    // -------------------------------------------------------------------------
    // 3. Four-Chambered Human Heart & Great Vessels (human_heart)
    // -------------------------------------------------------------------------
    const heartGroup = new THREE.Group();
    const myocardiumMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.32,
      roughness: 0.24,
      metalness: 0.08,
    });
    const veinMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.28,
      roughness: 0.28,
    });

    // Ventricular Cone (tilted obliquely toward left thorax +X)
    const heartVentricleGeo = new THREE.SphereGeometry(0.115, 28, 28);
    heartVentricleGeo.scale(0.92, 1.32, 0.84);
    const heartVentricle = new THREE.Mesh(heartVentricleGeo, myocardiumMat);
    heartVentricle.position.set(0.045, 0.36, 0.09);
    heartVentricle.rotation.z = -0.36;
    heartGroup.add(heartVentricle);

    // Right & Left Atria
    const rightAtriumGeo = new THREE.SphereGeometry(0.068, 20, 20);
    const rightAtrium = new THREE.Mesh(rightAtriumGeo, veinMat);
    rightAtrium.position.set(-0.03, 0.43, 0.08);
    heartGroup.add(rightAtrium);

    // Ascending Aorta & Aortic Arch
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.03, 0.45, 0.09),
      new THREE.Vector3(0.02, 0.56, 0.08),
      new THREE.Vector3(-0.02, 0.59, 0.02),
      new THREE.Vector3(-0.03, 0.51, -0.06),
      new THREE.Vector3(-0.02, -0.35, -0.10),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 36, 0.026, 14, false);
    heartGroup.add(new THREE.Mesh(aortaGeo, myocardiumMat));

    // Superior & Inferior Vena Cava
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.055, 0.62, 0.05),
      new THREE.Vector3(-0.045, 0.45, 0.07),
      new THREE.Vector3(-0.045, -0.35, -0.06),
    ]);
    const svcGeo = new THREE.TubeGeometry(svcCurve, 28, 0.022, 12, false);
    heartGroup.add(new THREE.Mesh(svcGeo, veinMat));

    registerOrganGroup('human_heart', heartGroup);

    // -------------------------------------------------------------------------
    // 4. Four-Lobed Liver & Gallbladder (human_liver)
    // -------------------------------------------------------------------------
    const liverGroup = new THREE.Group();
    const liverMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0x4c0519,
      emissiveIntensity: 0.24,
      roughness: 0.22,
      metalness: 0.08,
    });

    // Large Right Hepatic Lobe (-X side)
    const rightHepaticGeo = new THREE.SphereGeometry(0.175, 28, 28);
    rightHepaticGeo.scale(1.15, 0.78, 0.88);
    const rightHepatic = new THREE.Mesh(rightHepaticGeo, liverMat);
    rightHepatic.position.set(-0.14, 0.09, 0.06);
    rightHepatic.rotation.z = 0.18;
    liverGroup.add(rightHepatic);

    // Tapered Left Hepatic Lobe (+X side across midline)
    const leftHepaticGeo = new THREE.SphereGeometry(0.13, 24, 24);
    leftHepaticGeo.scale(1.22, 0.62, 0.76);
    const leftHepatic = new THREE.Mesh(leftHepaticGeo, liverMat);
    leftHepatic.position.set(0.03, 0.12, 0.09);
    leftHepatic.rotation.z = -0.12;
    liverGroup.add(leftHepatic);

    // Emerald Pear-Shaped Gallbladder nestled beneath right lobe
    const gallGeo = new THREE.SphereGeometry(0.042, 16, 16);
    gallGeo.scale(0.75, 1.35, 0.75);
    const gallMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      emissiveIntensity: 0.3,
      roughness: 0.25,
    });
    const gallbladder = new THREE.Mesh(gallGeo, gallMat);
    gallbladder.position.set(-0.11, -0.01, 0.12);
    gallbladder.rotation.z = 0.35;
    liverGroup.add(gallbladder);

    registerOrganGroup('human_liver', liverGroup);

    // -------------------------------------------------------------------------
    // 5. Muscular J-Stomach, Pancreas & Spleen (human_stomach)
    // -------------------------------------------------------------------------
    const stomachGroup = new THREE.Group();
    const stomachMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.24,
      roughness: 0.28,
      metalness: 0.06,
    });

    const jStomachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.18, 0.02),
      new THREE.Vector3(0.17, 0.14, 0.06),
      new THREE.Vector3(0.19, 0.01, 0.09),
      new THREE.Vector3(0.12, -0.08, 0.08),
      new THREE.Vector3(0.02, -0.06, 0.04),
    ]);
    const jStomachGeo = new THREE.TubeGeometry(jStomachCurve, 28, 0.068, 18, false);
    const jStomachMesh = new THREE.Mesh(jStomachGeo, stomachMat);
    stomachGroup.add(jStomachMesh);

    // Fundus dome
    const fundusGeo = new THREE.SphereGeometry(0.076, 20, 20);
    const fundusMesh = new THREE.Mesh(fundusGeo, stomachMat);
    fundusMesh.position.set(0.16, 0.12, 0.06);
    stomachGroup.add(fundusMesh);

    // Yellow Lobulated Pancreas behind stomach
    const pancreasMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
      roughness: 0.45,
    });
    const pancreasCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, -0.09, -0.01),
      new THREE.Vector3(0.08, -0.07, -0.02),
      new THREE.Vector3(0.20, -0.03, -0.04),
    ]);
    const pancreasGeo = new THREE.TubeGeometry(pancreasCurve, 18, 0.034, 12, false);
    stomachGroup.add(new THREE.Mesh(pancreasGeo, pancreasMat));

    registerOrganGroup('human_stomach', stomachGroup);

    // -------------------------------------------------------------------------
    // 6. Retroperitoneal Paired Kidneys, Ureters & Bladder (human_kidneys)
    // -------------------------------------------------------------------------
    const kidneysGroup = new THREE.Group();
    const kidneyMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x3b0764,
      emissiveIntensity: 0.26,
      roughness: 0.28,
      metalness: 0.06,
    });
    const ureterMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.38,
    });

    [-1, 1].forEach((side) => {
      const kGeo = new THREE.SphereGeometry(0.075, 22, 22);
      kGeo.scale(0.75, 1.35, 0.62);
      const kidney = new THREE.Mesh(kGeo, kidneyMat);
      const kY = side < 0 ? -0.09 : -0.06; // Right kidney slightly lower due to liver
      kidney.position.set(side * 0.16, kY, -0.11);
      kidney.rotation.z = side * -0.18;
      kidneysGroup.add(kidney);

      // Ureter descending to pelvic urinary bladder
      const ureterCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.13, kY - 0.02, -0.10),
        new THREE.Vector3(side * 0.09, -0.32, -0.08),
        new THREE.Vector3(side * 0.04, -0.56, 0.02),
      ]);
      const ureterGeo = new THREE.TubeGeometry(ureterCurve, 20, 0.0085, 8, false);
      kidneysGroup.add(new THREE.Mesh(ureterGeo, ureterMat));
    });

    // Pelvic Urinary Bladder
    const bladderGeo = new THREE.SphereGeometry(0.072, 20, 20);
    bladderGeo.scale(1.0, 0.88, 0.92);
    const bladder = new THREE.Mesh(bladderGeo, kidneyMat);
    bladder.position.set(0, -0.58, 0.05);
    kidneysGroup.add(bladder);

    registerOrganGroup('human_kidneys', kidneysGroup);

    // -------------------------------------------------------------------------
    // 7. Small & Large Intestines (human_intestines)
    // -------------------------------------------------------------------------
    const intestinesGroup = new THREE.Group();
    const colonMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
      roughness: 0.34,
    });
    const ileumMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.22,
      roughness: 0.3,
    });

    // Framing Large Intestine (Ascending, Transverse, Descending, Sigmoid Colon)
    const colonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.20, -0.44, 0.04),
      new THREE.Vector3(-0.21, -0.16, 0.06),
      new THREE.Vector3(0.0, -0.13, 0.11),
      new THREE.Vector3(0.21, -0.15, 0.06),
      new THREE.Vector3(0.20, -0.45, 0.03),
      new THREE.Vector3(0.08, -0.50, 0.01),
      new THREE.Vector3(0.0, -0.57, -0.03),
    ]);
    const colonGeo = new THREE.TubeGeometry(colonCurve, 48, 0.048, 14, false);
    intestinesGroup.add(new THREE.Mesh(colonGeo, colonMat));

    // Coiled Small Intestine Loops (Jejunum & Ileum)
    const smallCoilCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, -0.19, 0.08),
      new THREE.Vector3(0.11, -0.22, 0.10),
      new THREE.Vector3(-0.12, -0.27, 0.11),
      new THREE.Vector3(0.12, -0.32, 0.11),
      new THREE.Vector3(-0.11, -0.37, 0.10),
      new THREE.Vector3(0.10, -0.42, 0.09),
      new THREE.Vector3(-0.06, -0.46, 0.07),
    ]);
    const smallCoilGeo = new THREE.TubeGeometry(smallCoilCurve, 56, 0.034, 12, false);
    intestinesGroup.add(new THREE.Mesh(smallCoilGeo, ileumMat));

    registerOrganGroup('human_intestines', intestinesGroup);

    organGroupsRef.current = organMap;

    // -------------------------------------------------------------------------
    // Raycasting for Click Selection in 3D
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const pickableMeshes: THREE.Object3D[] = [];
      Object.values(organMap).forEach((grp) => {
        grp.traverse((ch) => {
          if (ch instanceof THREE.Mesh) pickableMeshes.push(ch);
        });
      });

      const hits = raycaster.intersectObjects(pickableMeshes, false);
      if (hits.length > 0) {
        const hitOrganId = hits[0].object.userData?.organId as string | undefined;
        if (hitOrganId) {
          setSelectedOrganId(hitOrganId);
          const found = HUMAN_ORGAN_LIST.find((o) => o.id === hitOrganId);
          if (found && onSelectOrgan) onSelectOrgan(found);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerup', onPointerUp);

    // -------------------------------------------------------------------------
    // Animation Loop (Physiological Heartbeat, Respiration, Selection Glow)
    // -------------------------------------------------------------------------
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Physiological cardiac pulsation (72 BPM)
      const heartPulse = 1.0 + Math.pow(Math.max(0, Math.sin(t * 7.5)), 3) * 0.065;
      heartVentricle.scale.set(0.92 * heartPulse, 1.32 * heartPulse, 0.84 * heartPulse);

      // Gentle pulmonary tidal breathing
      const breath = 1.0 + Math.sin(t * 2.1) * 0.035;
      lungsGroup.scale.set(breath, 1.0 + Math.sin(t * 2.1) * 0.02, breath);

      // Highlight selected organ subtly
      Object.entries(organMap).forEach(([id, grp]) => {
        const isSel = id === selectedOrganIdRef.current;
        grp.traverse((ch) => {
          if (ch instanceof THREE.Mesh && ch.material instanceof THREE.MeshStandardMaterial) {
            ch.material.emissiveIntensity = isSel
              ? 0.48 + Math.sin(t * 4.5) * 0.14
              : 0.18;
          }
        });
      });

      if (autoRotateRef.current && !controls.isPointerDown) {
        rootGroup.rotation.y += 0.0045;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      studioEnv.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (ribcageGroupRef.current) {
      ribcageGroupRef.current.visible = showRibcage;
    }
  }, [showRibcage]);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset(3.35, 0, Math.PI / 2.05, new THREE.Vector3(0, 0.08, 0));
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 select-none">
      {/* Interactive 3D Canvas */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top-Left Offline 3D Status & Quick Controls */}
      <div className="absolute top-14 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold shadow-lg">
          <WifiOff className="w-3 h-3 text-emerald-400" />
          Offline 3D Visceral Specimen Active
        </span>
        <button
          type="button"
          onClick={() => setShowRibcage((v) => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium cursor-pointer"
        >
          {showRibcage ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          <span>{showRibcage ? 'Ribcage: Visible' : 'Ribcage: Hidden'}</span>
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
            autoRotate
              ? 'bg-cyan-600 text-white border-cyan-400'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Auto-Rotate
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Camera</span>
        </button>
      </div>

      {/* Bottom Interactive Organ Selector & Live Dossier Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl">
          {HUMAN_ORGAN_LIST.map((organ) => {
            const active = organ.id === selectedOrganId;
            return (
              <button
                key={organ.id}
                type="button"
                onClick={() => {
                  setSelectedOrganId(organ.id);
                  if (onSelectOrgan) onSelectOrgan(organ);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-rose-600 text-white shadow-sm border border-rose-400'
                    : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: organ.color }}
                />
                <span>{organ.name.split(' & ')[0]}</span>
              </button>
            );
          })}
        </div>

        {selectedOrganInfo && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOrganInfo.color }}
                />
                <span className="font-bold text-white">{selectedOrganInfo.name}</span>
                <span className="text-[11px] italic text-slate-400">
                  ({selectedOrganInfo.scientificName})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">
                  {selectedOrganInfo.system}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2">{selectedOrganInfo.function}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface OfflineFrogInternalOrgans3DViewerProps {
  stage: 'external' | 'internal';
  selectedOrganId: FrogOrganId;
  onSelectOrgan: (organId: FrogOrganId) => void;
}

export const OfflineFrogInternalOrgans3DViewer: React.FC<
  OfflineFrogInternalOrgans3DViewerProps
> = ({ stage, selectedOrganId, onSelectOrgan }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const organGroupsRef = useRef<Partial<Record<FrogOrganId, THREE.Group>>>({});

  const selectedOrganIdRef = useRef<FrogOrganId>(selectedOrganId);
  selectedOrganIdRef.current = selectedOrganId;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060d18);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(0, 1.35, 2.65);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -0.75, {
      includeStagePlatform: false,
      includeGroundStage: false,
    });

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 1.1,
      maxDistance: 5.5,
    });
    controls.target.set(0, 0.12, 0);
    controls.saveInitialState(new THREE.Vector3(0, 1.35, 2.65), new THREE.Vector3(0, 0.12, 0));
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 0.5);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(5, 16, 0x10b981, 0x1e293b);
    styleStudioGridHelper(grid);
    grid.position.y = -0.65;
    scene.add(grid);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const organMap: Partial<Record<FrogOrganId, THREE.Group>> = {};
    const registerFrogOrgan = (id: FrogOrganId, grp: THREE.Group) => {
      grp.userData = { organId: id };
      grp.traverse((ch) => {
        if (ch instanceof THREE.Mesh) {
          ch.userData = { organId: id };
          ch.castShadow = true;
          ch.receiveShadow = true;
        }
      });
      organMap[id] = grp;
      rootGroup.add(grp);
    };

    // -------------------------------------------------------------------------
    // 1. Three-Chambered Amphibian Heart (heart) — Annotation #1
    // -------------------------------------------------------------------------
    const heartGroup = new THREE.Group();
    const ventricleMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0x881337,
      emissiveIntensity: 0.28,
      roughness: 0.24,
      metalness: 0.08,
    });
    const atriumLeftMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.24,
      roughness: 0.28,
    });
    const atriumRightMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      emissive: 0x4c0519,
      emissiveIntensity: 0.24,
      roughness: 0.28,
    });

    // Conical muscular single ventricle
    const ventricleGeo = new THREE.ConeGeometry(0.22, 0.42, 28);
    ventricleGeo.rotateX(Math.PI);
    const ventricleMesh = new THREE.Mesh(ventricleGeo, ventricleMat);
    ventricleMesh.position.set(0, 0.20, 0.14);
    heartGroup.add(ventricleMesh);

    // Right Atrium & Left Atrium
    const rightAtriumGeo = new THREE.SphereGeometry(0.145, 22, 22);
    const rightAtrium = new THREE.Mesh(rightAtriumGeo, atriumRightMat);
    rightAtrium.position.set(-0.14, 0.44, 0.12);
    heartGroup.add(rightAtrium);

    const leftAtriumGeo = new THREE.SphereGeometry(0.135, 22, 22);
    const leftAtrium = new THREE.Mesh(leftAtriumGeo, atriumLeftMat);
    leftAtrium.position.set(0.14, 0.44, 0.12);
    heartGroup.add(leftAtrium);

    // Conus Arteriosus & Bifurcating Truncus Arteriosus Arches
    const conusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.34, 0.22),
      new THREE.Vector3(0.0, 0.54, 0.20),
      new THREE.Vector3(0.0, 0.66, 0.14),
    ]);
    const conusGeo = new THREE.TubeGeometry(conusCurve, 20, 0.052, 14, false);
    heartGroup.add(new THREE.Mesh(conusGeo, atriumLeftMat));

    [-1, 1].forEach((side) => {
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.63, 0.15),
        new THREE.Vector3(side * 0.18, 0.72, 0.08),
        new THREE.Vector3(side * 0.28, 0.64, -0.06),
      ]);
      const archGeo = new THREE.TubeGeometry(archCurve, 18, 0.032, 12, false);
      heartGroup.add(new THREE.Mesh(archGeo, atriumLeftMat));
    });

    registerFrogOrgan('heart', heartGroup);

    // -------------------------------------------------------------------------
    // 2. Paired Sacculated Lungs (lungs) — Annotations #2 & #3
    // -------------------------------------------------------------------------
    const lungsGroup = new THREE.Group();
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0x881337,
      emissiveIntensity: 0.22,
      roughness: 0.38,
      metalness: 0.05,
    });

    [-1, 1].forEach((side) => {
      const sacGeo = new THREE.SphereGeometry(0.24, 26, 26);
      sacGeo.scale(0.78, 1.55, 0.72);
      const sacMesh = new THREE.Mesh(sacGeo, lungMat);
      sacMesh.position.set(side * 0.42, 0.30, -0.04);
      sacMesh.rotation.z = side * 0.28;
      lungsGroup.add(sacMesh);

      // Bronchial tube connecting laryngotracheal chamber to lung apex
      const bronchusCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.62, 0.02),
        new THREE.Vector3(side * 0.20, 0.56, 0.0),
        new THREE.Vector3(side * 0.34, 0.46, -0.02),
      ]);
      const bronchusGeo = new THREE.TubeGeometry(bronchusCurve, 14, 0.034, 10, false);
      lungsGroup.add(new THREE.Mesh(bronchusGeo, lungMat));
    });

    registerFrogOrgan('lungs', lungsGroup);

    // -------------------------------------------------------------------------
    // 3. Three-Lobed Hepatic Liver & Gallbladder (liver, gallbladder)
    // -------------------------------------------------------------------------
    const liverGroup = new THREE.Group();
    const liverMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0x4c0519,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    });

    const leftAntLobe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 22), liverMat);
    leftAntLobe.scale.set(1.05, 0.58, 0.78);
    leftAntLobe.position.set(0.26, -0.02, 0.10);
    liverGroup.add(leftAntLobe);

    const leftPostLobe = new THREE.Mesh(new THREE.SphereGeometry(0.21, 22, 22), liverMat);
    leftPostLobe.scale.set(0.95, 0.52, 0.74);
    leftPostLobe.position.set(0.22, -0.16, 0.04);
    liverGroup.add(leftPostLobe);

    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 22, 22), liverMat);
    rightLobe.scale.set(1.08, 0.60, 0.80);
    rightLobe.position.set(-0.26, -0.05, 0.08);
    liverGroup.add(rightLobe);

    const gallMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x052e16,
      emissiveIntensity: 0.3,
      roughness: 0.22,
    });
    const gallMesh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 18), gallMat);
    gallMesh.position.set(-0.08, -0.08, 0.14);
    liverGroup.add(gallMesh);

    registerFrogOrgan('liver', liverGroup);

    // -------------------------------------------------------------------------
    // 4. J-Shaped Stomach & Coiled Intestines (stomach, small_intestine)
    // -------------------------------------------------------------------------
    const stomachGroup = new THREE.Group();
    const stomachMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
      roughness: 0.38,
    });
    const stomachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 0.02, -0.06),
      new THREE.Vector3(0.32, -0.18, 0.02),
      new THREE.Vector3(0.24, -0.36, 0.06),
      new THREE.Vector3(0.06, -0.38, 0.04),
    ]);
    const stomachGeo = new THREE.TubeGeometry(stomachCurve, 24, 0.095, 16, false);
    stomachGroup.add(new THREE.Mesh(stomachGeo, stomachMat));
    registerFrogOrgan('stomach', stomachGroup);

    const intestineGroup = new THREE.Group();
    const intestineMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
      roughness: 0.36,
    });
    const intCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, -0.38, 0.04),
      new THREE.Vector3(-0.16, -0.30, 0.08),
      new THREE.Vector3(0.08, -0.46, 0.10),
      new THREE.Vector3(-0.14, -0.50, 0.06),
      new THREE.Vector3(0.0, -0.58, 0.0),
    ]);
    const intGeo = new THREE.TubeGeometry(intCurve, 32, 0.058, 12, false);
    intestineGroup.add(new THREE.Mesh(intGeo, intestineMat));
    registerFrogOrgan('small_intestine', intestineGroup);

    organGroupsRef.current = organMap;

    // Raycasting for Click Selection in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const meshes: THREE.Object3D[] = [];
      Object.values(organMap).forEach((g) => {
        g?.traverse((c) => {
          if (c instanceof THREE.Mesh) meshes.push(c);
        });
      });
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData?.organId as FrogOrganId | undefined;
        if (hitId) onSelectOrgan(hitId);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerup', onPointerUp);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Amphibian 3-chambered cardiac cycle (48 BPM)
      const beat = 1.0 + Math.pow(Math.max(0, Math.sin(t * 5.0)), 3) * 0.09;
      ventricleMesh.scale.set(beat, beat, beat);

      // Buccopharyngeal positive-pressure lung inflation
      const swell = 1.0 + Math.sin(t * 2.2) * 0.065;
      lungsGroup.scale.set(swell, swell, swell);

      Object.entries(organMap).forEach(([id, grp]) => {
        if (!grp) return;
        const isSel = id === selectedOrganIdRef.current;
        grp.traverse((ch) => {
          if (ch instanceof THREE.Mesh && ch.material instanceof THREE.MeshStandardMaterial) {
            ch.material.emissiveIntensity = isSel
              ? 0.52 + Math.sin(t * 4.5) * 0.15
              : 0.2;
          }
        });
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      studioEnv.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-950 select-none flex flex-col">
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top-Right Offline Badge & Numbered Landmarks Quick Buttons */}
      <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold shadow-lg">
          <WifiOff className="w-3 h-3 text-emerald-400" />
          {stage === 'internal'
            ? 'Offline 3D Frog Heart & Lungs Active'
            : 'Offline 3D Frog Specimen Active'}
        </span>
        <button
          type="button"
          onClick={() => onSelectOrgan('heart')}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
            selectedOrganId === 'heart'
              ? 'bg-rose-600 text-white border-rose-400'
              : 'bg-slate-900/90 text-rose-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          1 · Heart
        </button>
        <button
          type="button"
          onClick={() => onSelectOrgan('lungs')}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
            selectedOrganId === 'lungs'
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-slate-900/90 text-sky-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          2 & 3 · Lungs
        </button>
        <button
          type="button"
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset(2.65, 0, Math.PI / 2.6, new THREE.Vector3(0, 0.12, 0));
            }
          }}
          className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
          title="Reset 3D Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
