import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { FROG_ORGAN_MANIFEST, FROG_ORGAN_LIST } from '../../data/frogAnatomyData';
import { FrogOrganId } from '../../types/frogAnatomy';
import { ModelPositionControls } from '../common/ModelPositionControls';
import { setupPreBatch1StudioEnvironment } from '../../simulations/preBatch1VisualUpgradeStudio';
import { soundEngine } from '../../utils/soundEngine';
import {
  Scissors,
  RotateCcw,
  CheckCircle2,
  Heart,
  Sparkles,
  Info,
  Play,
  RotateCw,
  Eye,
  Sliders,
  Maximize2,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FrogNeckDissectionSceneProps {
  onDissectionComplete?: () => void;
  onInspectOrgans?: () => void;
  isDissectionCompleted?: boolean;
}

// Unified State-Driven Dissection Audio Bridge
class DissectionAudioFX {
  public enabled: boolean = true;

  playIncisionTick(progress: number) {
    if (!this.enabled) return;
    soundEngine.playSurgicalIncision({
      sourceId: 'frog-neck-dissection',
      progress,
      velocity: 1.0,
    });
  }

  playDissectionComplete() {
    if (!this.enabled) return;
    soundEngine.playUiFeedback('dissection_complete', `frog_dissection_complete_${Date.now()}`);
  }
}

const audioFX = new DissectionAudioFX();

export const FrogNeckDissectionScene: React.FC<FrogNeckDissectionSceneProps> = ({
  onDissectionComplete,
  onInspectOrgans,
  isDissectionCompleted = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Rotation Angle state (in degrees, 0 to 90)
  const [neckAngleDeg, setNeckAngleDeg] = useState<number>(isDissectionCompleted ? 90 : 0);
  const [completed, setCompleted] = useState<boolean>(isDissectionCompleted);
  const [isDraggingNeck, setIsDraggingNeck] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedOrgan, setSelectedOrgan] = useState<FrogOrganId | null>(null);
  const [cameraMode, setCameraMode] = useState<'ventral' | 'cranial' | 'orbit'>('ventral');
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dissectionGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (dissectionGroupRef.current) {
      dissectionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsKeyboardActive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // References for render loop
  const neckAngleDegRef = useRef(neckAngleDeg);
  neckAngleDegRef.current = neckAngleDeg;

  const targetNeckAngleRef = useRef(neckAngleDeg);
  const lastSoundTickAngleRef = useRef(neckAngleDeg);

  // Mesh refs for animated updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const neckGroupRef = useRef<THREE.Group | null>(null);
  const heartMeshRef = useRef<THREE.Mesh | null>(null);
  const leftLungRef = useRef<THREE.Mesh | null>(null);
  const rightLungRef = useRef<THREE.Mesh | null>(null);
  const leftSkinFlapRef = useRef<THREE.Mesh | null>(null);
  const rightSkinFlapRef = useRef<THREE.Mesh | null>(null);
  const incisionGuideRingRef = useRef<THREE.Mesh | null>(null);
  const incisionGuideArrowRef = useRef<THREE.Group | null>(null);
  const visceraGroupRef = useRef<THREE.Group | null>(null);

  // Drag interaction math refs
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartAngleRef = useRef<number>(0);
  const isPointerDownOnNeckRef = useRef<boolean>(false);

  // Sync prop changes
  useEffect(() => {
    if (isDissectionCompleted && !completed) {
      setCompleted(true);
      setNeckAngleDeg(90);
      targetNeckAngleRef.current = 90;
    }
  }, [isDissectionCompleted, completed]);

  // Audio toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioFX.enabled = next;
  };

  // Three.js scene initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 4.2, 3.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 2.5,
      maxDistance: 9.0,
      minPolarAngle: 0.1,
      maxPolarAngle: Math.PI / 2 + 0.1,
    });
    controls.target.set(0, 0.2, 0);
    controlsRef.current = controls;

    // 4. Lighting Rig (Key, Fill, Rim)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 0.4);
    rimLight.position.set(0, -3, 5);
    scene.add(rimLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -0.35, {
      stageRadius: 3.8,
      fogDensity: 0.015,
    });

    // Universal Dissection Position Group
    const dissectionGroup = new THREE.Group();
    dissectionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    dissectionGroupRef.current = dissectionGroup;
    scene.add(dissectionGroup);

    // 5. Surgical Dissection Wax Pan & Tray
    const trayGroup = new THREE.Group();
    dissectionGroup.add(trayGroup);

    // Outer Stainless Steel Pan Lip
    const panLipGeo = new THREE.BoxGeometry(4.8, 0.25, 5.8);
    const panLipMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const panLip = new THREE.Mesh(panLipGeo, panLipMat);
    panLip.position.set(0, -0.15, 0);
    panLip.receiveShadow = true;
    trayGroup.add(panLip);

    // Blue-gray wax pan bottom bed
    const waxGeo = new THREE.BoxGeometry(4.4, 0.18, 5.4);
    const waxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.1,
    });
    const waxBed = new THREE.Mesh(waxGeo, waxMat);
    waxBed.position.set(0, -0.08, 0);
    waxBed.receiveShadow = true;
    trayGroup.add(waxBed);

    // Pan Measurement Grid Lines on Wax
    const gridHelper = new THREE.GridHelper(4.0, 16, 0x334155, 0x1e293b);
    gridHelper.position.set(0, 0.02, 0);
    trayGroup.add(gridHelper);

    // Dissection Pins (4 T-Pins securing the specimen)
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 12);
    const pinHeadGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });

    const pinCoords: [number, number, number, number][] = [
      [-1.3, 0.2, 1.2, 0.3], // Left forelimb
      [1.3, 0.2, 1.2, -0.3], // Right forelimb
      [-1.4, 0.2, -1.8, 0.4], // Left hindlimb
      [1.4, 0.2, -1.8, -0.4], // Right hindlimb
    ];

    pinCoords.forEach(([x, y, z, rotZ]) => {
      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, y, z);
      pinGroup.rotation.z = rotZ;
      const stem = new THREE.Mesh(pinGeo, pinMat);
      stem.castShadow = true;
      const cap = new THREE.Mesh(pinHeadGeo, pinMat);
      cap.position.y = 0.3;
      pinGroup.add(stem, cap);
      trayGroup.add(pinGroup);
    });

    // 6. Frog Specimen Root (Ventral side facing up)
    const frogRoot = new THREE.Group();
    frogRoot.position.set(0, 0.05, 0);
    dissectionGroup.add(frogRoot);

    // Ventral pale cream skin material & olive spotted back skin
    const ventralSkinMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Pale yellow-cream amphibian belly
      roughness: 0.45,
      metalness: 0.05,
    });
    const dorsalSkinMat = new THREE.MeshStandardMaterial({
      color: 0x3f6212, // Spotted olive moss green
      roughness: 0.55,
      metalness: 0.05,
    });
    const cutTissueMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Subcutaneous tissue crimson
      roughness: 0.6,
      metalness: 0.1,
    });

    // --- Static Posterior Torso & Limbs ---
    const torsoGroup = new THREE.Group();
    frogRoot.add(torsoGroup);

    // Main Ventral Abdomen
    const abdomenGeo = new THREE.CylinderGeometry(0.72, 0.65, 1.6, 24);
    abdomenGeo.rotateX(Math.PI / 2);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, ventralSkinMat);
    abdomenMesh.position.set(0, 0.25, -0.5);
    abdomenMesh.scale.set(1.1, 0.45, 1.0);
    abdomenMesh.castShadow = true;
    abdomenMesh.receiveShadow = true;
    torsoGroup.add(abdomenMesh);

    // Hindlimbs (Z-folded jumping limbs pinned out)
    [-1, 1].forEach((side) => {
      const thighGeo = new THREE.CylinderGeometry(0.18, 0.14, 1.2, 16);
      const thigh = new THREE.Mesh(thighGeo, dorsalSkinMat);
      thigh.position.set(side * 0.9, 0.18, -1.2);
      thigh.rotation.z = side * 1.1;
      thigh.rotation.x = -0.4;
      torsoGroup.add(thigh);

      const shinGeo = new THREE.CylinderGeometry(0.13, 0.1, 1.1, 16);
      const shin = new THREE.Mesh(shinGeo, dorsalSkinMat);
      shin.position.set(side * 1.3, 0.15, -1.8);
      shin.rotation.z = side * -0.5;
      torsoGroup.add(shin);

      // Webbed foot pad
      const footGeo = new THREE.ConeGeometry(0.2, 0.6, 5);
      footGeo.rotateX(-Math.PI / 2);
      const foot = new THREE.Mesh(footGeo, dorsalSkinMat);
      foot.position.set(side * 1.4, 0.1, -2.1);
      torsoGroup.add(foot);
    });

    // Forelimbs pinned laterally
    [-1, 1].forEach((side) => {
      const armGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.9, 16);
      const arm = new THREE.Mesh(armGeo, dorsalSkinMat);
      arm.position.set(side * 0.95, 0.22, 0.7);
      arm.rotation.z = side * 1.25;
      arm.rotation.y = side * 0.3;
      torsoGroup.add(arm);

      const handGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const hand = new THREE.Mesh(handGeo, dorsalSkinMat);
      hand.position.set(side * 1.35, 0.16, 0.9);
      torsoGroup.add(hand);
    });

    // Midline Linea Alba Incision Line (Ventral belly mark)
    const incisionLineGeo = new THREE.BoxGeometry(0.03, 0.02, 1.4);
    const incisionLineMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.3,
    });
    const incisionLine = new THREE.Mesh(incisionLineGeo, incisionLineMat);
    incisionLine.position.set(0, 0.44, -0.48);
    torsoGroup.add(incisionLine);

    // --- Exposed Internal Viscera (Mounted inside coelomic cavity) ---
    const visceraGroup = new THREE.Group();
    visceraGroup.position.set(0, 0.2, 0.1);
    frogRoot.add(visceraGroup);
    visceraGroupRef.current = visceraGroup;

    // Cut Sternum Margins (Bilateral white cartilage edges)
    [-1, 1].forEach((side) => {
      const sternumGeo = new THREE.BoxGeometry(0.08, 0.12, 0.9);
      const sternumMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.4,
      });
      const sternum = new THREE.Mesh(sternumGeo, sternumMat);
      sternum.position.set(side * 0.42, 0.15, 0.1);
      visceraGroup.add(sternum);
    });

    // 1. Three-Chambered Heart (Cor amphibium)
    const heartGroup = new THREE.Group();
    heartGroup.position.set(0, 0.26, 0.45);
    visceraGroup.add(heartGroup);

    // Ventricle (conical muscular apex)
    const ventricleGeo = new THREE.ConeGeometry(0.18, 0.32, 24);
    ventricleGeo.rotateX(Math.PI);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Rose red
      roughness: 0.3,
      metalness: 0.1,
    });
    const ventricleMesh = new THREE.Mesh(ventricleGeo, heartMat);
    ventricleMesh.position.set(0, 0, 0);
    heartGroup.add(ventricleMesh);
    heartMeshRef.current = ventricleMesh;

    // Dual Atria (Left & Right)
    const leftAtriumGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const leftAtriumMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
    const leftAtrium = new THREE.Mesh(leftAtriumGeo, leftAtriumMat);
    leftAtrium.position.set(-0.11, 0.12, 0);
    heartGroup.add(leftAtrium);

    const rightAtriumGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const rightAtriumMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35 });
    const rightAtrium = new THREE.Mesh(rightAtriumGeo, rightAtriumMat);
    rightAtrium.position.set(0.11, 0.12, 0);
    heartGroup.add(rightAtrium);

    // Conus arteriosus trunk
    const conusGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 16);
    const conusMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.3 });
    const conus = new THREE.Mesh(conusGeo, conusMat);
    conus.position.set(0, 0.22, 0.03);
    heartGroup.add(conus);

    // 2. Paired Sacculated Lungs
    const lungGeo = new THREE.SphereGeometry(0.19, 16, 16);
    lungGeo.scale(0.8, 1.4, 0.7);
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.6,
      wireframe: false,
    });

    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.position.set(-0.35, 0.2, 0.3);
    leftLung.rotation.z = -0.3;
    visceraGroup.add(leftLung);
    leftLungRef.current = leftLung;

    const rightLung = new THREE.Mesh(lungGeo, lungMat);
    rightLung.position.set(0.35, 0.2, 0.3);
    rightLung.rotation.z = 0.3;
    visceraGroup.add(rightLung);
    rightLungRef.current = rightLung;

    // 3. Three-Lobed Liver (Hepar trilobatum)
    const liverMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      roughness: 0.45,
      metalness: 0.05,
    });

    // Left Anterior Lobe
    const liverLobe1Geo = new THREE.SphereGeometry(0.24, 16, 16);
    liverLobe1Geo.scale(1.1, 0.5, 0.8);
    const liverLobe1 = new THREE.Mesh(liverLobe1Geo, liverMat);
    liverLobe1.position.set(-0.25, 0.15, 0.08);
    visceraGroup.add(liverLobe1);

    // Left Posterior Lobe
    const liverLobe2 = new THREE.Mesh(liverLobe1Geo, liverMat);
    liverLobe2.position.set(-0.2, 0.12, -0.22);
    liverLobe2.scale.set(0.9, 0.45, 0.7);
    visceraGroup.add(liverLobe2);

    // Right Lobe
    const liverLobe3 = new THREE.Mesh(liverLobe1Geo, liverMat);
    liverLobe3.position.set(0.26, 0.14, 0.02);
    liverLobe3.scale.set(1.0, 0.5, 0.85);
    visceraGroup.add(liverLobe3);

    // Gallbladder (tiny green bile sac nestled under right lobe)
    const gallGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const gallMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });
    const gall = new THREE.Mesh(gallGeo, gallMat);
    gall.position.set(0.12, 0.1, -0.05);
    visceraGroup.add(gall);

    // 4. J-Shaped Stomach (Gaster)
    const stomachGeo = new THREE.TorusGeometry(0.3, 0.12, 12, 24, Math.PI * 0.85);
    const stomachMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const stomach = new THREE.Mesh(stomachGeo, stomachMat);
    stomach.position.set(-0.18, 0.08, -0.42);
    stomach.rotation.x = Math.PI / 2;
    stomach.rotation.z = 0.5;
    visceraGroup.add(stomach);

    // 5. Coiled Small Intestine
    const intestineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.06, -0.4),
      new THREE.Vector3(0.2, 0.08, -0.5),
      new THREE.Vector3(0.1, 0.07, -0.7),
      new THREE.Vector3(-0.05, 0.06, -0.65),
      new THREE.Vector3(0.0, 0.05, -0.9),
    ]);
    const intestineGeo = new THREE.TubeGeometry(intestineCurve, 32, 0.065, 8, false);
    const intestineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    const intestine = new THREE.Mesh(intestineGeo, intestineMat);
    visceraGroup.add(intestine);

    // --- Bilateral Reflecting Skin Flaps (Open as neck/incision rotates) ---
    const flapGeo = new THREE.BoxGeometry(0.38, 0.04, 0.9);
    flapGeo.translate(0.19, 0, 0); // Origin at hinge line

    const leftFlap = new THREE.Mesh(flapGeo, ventralSkinMat);
    leftFlap.position.set(-0.4, 0.28, 0.1);
    leftSkinFlapRef.current = leftFlap;
    torsoGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(flapGeo, ventralSkinMat);
    rightFlap.position.set(0.4, 0.28, 0.1);
    rightFlap.scale.set(-1, 1, 1);
    rightSkinFlapRef.current = rightFlap;
    torsoGroup.add(rightFlap);

    // --- ARTICULATED ROTATABLE NECK & HEAD GROUP ---
    // This is the active rotatable unit that the user manipulates with mouse!
    const neckGroup = new THREE.Group();
    // Pivot at cervical joint (base of cranium / throat)
    neckGroup.position.set(0, 0.25, 0.9);
    frogRoot.add(neckGroup);
    neckGroupRef.current = neckGroup;

    // Cranium & Snout (Wide amphibian head)
    const headGeo = new THREE.ConeGeometry(0.75, 1.1, 24);
    headGeo.rotateX(Math.PI / 2);
    headGeo.scale(1.15, 0.38, 1.0);
    const headMesh = new THREE.Mesh(headGeo, dorsalSkinMat);
    headMesh.position.set(0, 0.05, 0.55);
    headMesh.castShadow = true;
    neckGroup.add(headMesh);

    // Ventral Gular (Throat) Region (Pale cream underside of throat)
    const throatGeo = new THREE.CylinderGeometry(0.48, 0.65, 0.55, 20);
    throatGeo.rotateX(Math.PI / 2);
    throatGeo.scale(1.0, 0.32, 1.0);
    const throatMesh = new THREE.Mesh(throatGeo, ventralSkinMat);
    throatMesh.position.set(0, -0.02, 0.2);
    neckGroup.add(throatMesh);

    // Eyes with prominent dorsal bulges
    [-0.38, 0.38].forEach((eyeX) => {
      const eyeBulgeGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const eyeBulge = new THREE.Mesh(eyeBulgeGeo, dorsalSkinMat);
      eyeBulge.position.set(eyeX, 0.22, 0.5);
      neckGroup.add(eyeBulge);

      // Pupil iris
      const irisGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const irisMat = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        roughness: 0.1,
        metalness: 0.8,
      });
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(eyeX * 1.05, 0.26, 0.52);
      neckGroup.add(iris);
    });

    // Circular Tympanic Membrane (Behind each eye)
    [-0.52, 0.52].forEach((tympX) => {
      const tympGeo = new THREE.CircleGeometry(0.1, 16);
      tympGeo.rotateY(Math.PI / 2 * (tympX > 0 ? 1 : -1));
      const tympMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.6 });
      const tymp = new THREE.Mesh(tympGeo, tympMat);
      tymp.position.set(tympX, 0.12, 0.35);
      neckGroup.add(tymp);
    });

    // Cervical Cut Margin (Red flesh circle where neck tissues separate)
    const cervicalCutGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.04, 24);
    cervicalCutGeo.rotateX(Math.PI / 2);
    const cervicalCut = new THREE.Mesh(cervicalCutGeo, cutTissueMat);
    cervicalCut.position.set(0, 0, 0.02);
    neckGroup.add(cervicalCut);

    // --- INTERACTIVE ROTATION GIZMO & GUIDE RING ON THE NECK ---
    // Prominent, interactive visual ring that highlights the neck portion
    const ringGeo = new THREE.TorusGeometry(0.68, 0.035, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald surgical guide
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const guideRing = new THREE.Mesh(ringGeo, ringMat);
    guideRing.position.set(0, 0.05, 0.0);
    neckGroup.add(guideRing);
    incisionGuideRingRef.current = guideRing;

    // Interactive Knurled Rotation Pin / Handle on the right side of the neck
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0.75, 0.05, 0);

    const pinShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
    pinShaftGeo.rotateZ(Math.PI / 2);
    const pinShaft = new THREE.Mesh(pinShaftGeo, pinMat);

    const pinSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pinSphereMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    const pinSphere = new THREE.Mesh(pinSphereGeo, pinSphereMat);
    pinSphere.position.x = 0.2;

    handleGroup.add(pinShaft, pinSphere);
    neckGroup.add(handleGroup);
    incisionGuideArrowRef.current = handleGroup;

    // 7. Raycaster for Drag Interaction
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    // Mouse / Touch Event Handlers for Neck Rotation
    const getPointerCoords = (e: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        normX: ((clientX - rect.left) / rect.width) * 2 - 1,
        normY: -((clientY - rect.top) / rect.height) * 2 + 1,
        clientX,
        clientY,
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const coords = getPointerCoords(e);
      mouseVector.set(coords.normX, coords.normY);
      raycaster.setFromCamera(mouseVector, camera);

      // Check intersection with neck meshes or handle
      const objectsToCheck = [neckGroup, guideRing, handleGroup, headMesh, throatMesh];
      const intersects = raycaster.intersectObjects(objectsToCheck, true);

      if (intersects.length > 0) {
        // User clicked directly on the neck or rotation handle!
        isPointerDownOnNeckRef.current = true;
        dragStartPosRef.current = { x: coords.clientX, y: coords.clientY };
        dragStartAngleRef.current = targetNeckAngleRef.current;
        setIsDraggingNeck(true);

        // Temporarily disable orbit controls so dragging rotates neck, not camera!
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }

        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const coords = getPointerCoords(e);

      // Hover feedback when not dragging
      if (!isPointerDownOnNeckRef.current) {
        mouseVector.set(coords.normX, coords.normY);
        raycaster.setFromCamera(mouseVector, camera);
        const intersects = raycaster.intersectObjects([neckGroup, guideRing, handleGroup], true);

        if (intersects.length > 0) {
          renderer.domElement.style.cursor = 'grab';
          if (guideRing.material instanceof THREE.MeshStandardMaterial) {
            guideRing.material.emissiveIntensity = 1.0;
          }
        } else {
          renderer.domElement.style.cursor = 'default';
          if (guideRing.material instanceof THREE.MeshStandardMaterial) {
            guideRing.material.emissiveIntensity = 0.5;
          }
        }
        return;
      }

      // We are dragging the neck! Calculate rotation delta from mouse movement
      const deltaX = coords.clientX - dragStartPosRef.current.x;
      const deltaY = coords.clientY - dragStartPosRef.current.y;

      // Diagonal / horizontal mouse drag translates into angle degrees (approx 1.8 px per degree)
      const angleDelta = (deltaX - deltaY * 0.5) * 0.55;
      let newAngle = dragStartAngleRef.current + angleDelta;

      // Clamp between 0° and 90°
      newAngle = Math.max(0, Math.min(90, newAngle));
      targetNeckAngleRef.current = newAngle;
      setNeckAngleDeg(Math.round(newAngle));

      // Trigger micro-tick audio every 6 degrees
      if (Math.abs(newAngle - lastSoundTickAngleRef.current) >= 6) {
        audioFX.playIncisionTick(newAngle / 90);
        lastSoundTickAngleRef.current = newAngle;
      }

      // Check if threshold reached
      if (newAngle >= 85 && !completed) {
        setCompleted(true);
        audioFX.playDissectionComplete();
        if (onDissectionComplete) {
          onDissectionComplete();
        }
        if (onInspectOrgans) {
          onInspectOrgans();
        }
      }
    };

    const handlePointerUp = () => {
      if (isPointerDownOnNeckRef.current) {
        isPointerDownOnNeckRef.current = false;
        setIsDraggingNeck(false);
        renderer.domElement.style.cursor = 'default';

        // Re-enable orbit controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }

        // If dragged near 90°, snap to 90°
        if (targetNeckAngleRef.current >= 80) {
          targetNeckAngleRef.current = 90;
          setNeckAngleDeg(90);
          if (!completed) {
            setCompleted(true);
            audioFX.playDissectionComplete();
            if (onDissectionComplete) {
              onDissectionComplete();
            }
            if (onInspectOrgans) {
              onInspectOrgans();
            }
          }
        }
      }
    };

    // Attach listeners
    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // 8. Animation Render Loop (Smooth Damping)
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Smooth exponential damping on neck rotation
      const currentAngleRad = neckGroup.rotation.z;
      const targetAngleRad = (targetNeckAngleRef.current * Math.PI) / 180;
      const smoothedAngleRad = THREE.MathUtils.damp(currentAngleRad, targetAngleRad, 14, delta);

      neckGroup.rotation.z = smoothedAngleRad;
      // Slight outward lateral tilt as neck is rotated/reflected
      neckGroup.rotation.y = smoothedAngleRad * 0.35;
      neckGroup.rotation.x = -smoothedAngleRad * 0.15;

      const progress = smoothedAngleRad / ((90 * Math.PI) / 180);

      // Reflect lateral dermal flaps outward dynamically
      if (leftSkinFlapRef.current) {
        leftSkinFlapRef.current.rotation.y = -progress * 1.5;
        leftSkinFlapRef.current.position.y = 0.28 + progress * 0.05;
      }
      if (rightSkinFlapRef.current) {
        rightSkinFlapRef.current.rotation.y = progress * 1.5;
        rightSkinFlapRef.current.position.y = 0.28 + progress * 0.05;
      }

      // Heartbeat pulse animation on exposed heart
      if (heartMeshRef.current) {
        const beatCycle = Math.sin(time * 5.0);
        const beatScale = 1.0 + Math.max(0, beatCycle * 0.12);
        heartMeshRef.current.scale.set(beatScale, beatScale, beatScale);
      }

      // Gentle respiratory tidal swell on paired lungs
      if (leftLungRef.current && rightLungRef.current) {
        const lungSwell = 1.0 + Math.sin(time * 2.2) * 0.06;
        leftLungRef.current.scale.set(lungSwell, lungSwell, lungSwell);
        rightLungRef.current.scale.set(lungSwell, lungSwell, lungSwell);
      }

      // Ring pulsation when not completed
      if (guideRing.material instanceof THREE.MeshStandardMaterial) {
        if (!completed) {
          const pulse = 0.5 + Math.sin(time * 3.5) * 0.25;
          guideRing.material.emissiveIntensity = isDraggingNeck ? 1.0 : pulse;
        } else {
          guideRing.material.color.setHex(0x10b981);
          guideRing.material.emissiveIntensity = 0.4;
        }
      }

      // Orbit controls update
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();

      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      studioEnv.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Quick camera presets
  const handleSetCameraPreset = (preset: 'ventral' | 'cranial' | 'orbit') => {
    setCameraMode(preset);
    if (!controlsRef.current) return;
    if (preset === 'ventral') {
      controlsRef.current.camera.position.set(0, 4.2, 3.2);
      controlsRef.current.target.set(0, 0.2, 0);
    } else if (preset === 'cranial') {
      controlsRef.current.camera.position.set(0, 3.2, 4.6);
      controlsRef.current.target.set(0, 0.3, 0.6);
    } else if (preset === 'orbit') {
      controlsRef.current.camera.position.set(2.8, 3.0, 2.5);
      controlsRef.current.target.set(0, 0.2, 0);
    }
  };

  // Slider or button rotation handler
  const handleAngleChange = (angle: number) => {
    targetNeckAngleRef.current = angle;
    setNeckAngleDeg(angle);
    if (Math.abs(angle - lastSoundTickAngleRef.current) >= 6) {
      audioFX.playIncisionTick(angle / 90);
      lastSoundTickAngleRef.current = angle;
    }
    if (angle >= 85 && !completed) {
      setCompleted(true);
      audioFX.playDissectionComplete();
      if (onDissectionComplete) {
        onDissectionComplete();
      }
      if (onInspectOrgans) {
        onInspectOrgans();
      }
    }
  };

  // Auto-rotate animate to 90°
  const handleAutoDissect = () => {
    let current = targetNeckAngleRef.current;
    const interval = setInterval(() => {
      current += 3;
      if (current >= 90) {
        current = 90;
        clearInterval(interval);
        handleAngleChange(90);
      } else {
        handleAngleChange(current);
      }
    }, 25);
  };

  // Reset dissection
  const handleReset = () => {
    targetNeckAngleRef.current = 0;
    setNeckAngleDeg(0);
    setCompleted(false);
    setSelectedOrgan(null);
  };

  return (
    <div
      ref={wrapperRef}
      onClick={() => {
        if (!isKeyboardActive) setIsKeyboardActive(true);
      }}
      className="w-full flex flex-col gap-4 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl relative"
    >

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[400px] sm:h-[450px] lg:h-[480px] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#0a0f1d]">
        <div ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Top-Left Dissection Progress Dial & Status */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-xs pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-xl space-y-1.5 pointer-events-auto">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                Cervical Neck Rotation
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                {neckAngleDeg}° / 90°
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className={`h-full transition-all duration-150 rounded-full ${
                  completed
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${(neckAngleDeg / 90) * 100}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-300">
              {completed ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Neck rotated 90° · Coelom exposed
                </span>
              ) : isDraggingNeck ? (
                <span className="text-amber-300 font-medium">Rotating neck... continue to 90°</span>
              ) : (
                <span className="text-slate-400">Drag green neck ring with mouse to rotate</span>
              )}
            </div>
          </div>
        </div>

        {/* Floating Quick Action Button when Completed (docked in corner, never obscuring the frog) */}
        {completed && onInspectOrgans && (
          <div className="absolute bottom-3 right-3 z-10 animate-in fade-in">
            <button
              onClick={onInspectOrgans}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-950/60 ring-2 ring-rose-400/50 transition-all cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Inspect Internal Organs →</span>
            </button>
          </div>
        )}
      </div>

      {/* Universal 3D Model Position Controls (Directly BELOW the 3D Viewer) */}
      <ModelPositionControls
        position={modelPosition}
        onChange={setModelPosition}
        onReset={() => setModelPosition({ x: 0, y: 0 })}
        range={{ minX: -4, maxX: 4, minY: -3, maxY: 3, step: 0.1 }}
        isKeyboardActive={isKeyboardActive}
        onToggleKeyboardActive={setIsKeyboardActive}
      />

    </div>
  );
};
