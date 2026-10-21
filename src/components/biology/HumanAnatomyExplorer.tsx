import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import {
  Heart,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Info,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Layers,
  User,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
} from 'lucide-react';
import { ModelPositionControls } from '../common/ModelPositionControls';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';
import {
  SKETCHFAB_HUMAN_CONFIG,
  HUMAN_ORGAN_LIST,
  HumanOrganInfo,
} from '../../data/humanAnatomyData';

// Dissection State Machine
export type DissectionState =
  | 'IDLE'                  // Standard 3D exploration and camera orbiting
  | 'GUIDE_READY'           // Dissection mode enabled, guide highlighted, probe ready at start
  | 'INTERACTION_ACTIVE'    // User dragging probe along abdominal guide
  | 'INTERACTION_COMPLETE'  // Dissection completed 100%, completion summary displayed
  | 'ORGANS_REVEALED';      // Internal organs viewer active

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class HumanViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HumanAnatomyExplorer caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 rounded-2xl bg-slate-900 border border-rose-500/40 text-center text-white space-y-4 my-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-300">Human 3D Specimen Viewer Error</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {this.state.error?.message ||
              'A WebGL memory or rendering issue occurred. Click retry to restore the 3D viewer.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
          >
            Retry Human Specimen Viewer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Procedural Web Audio Sound Generator (Zero external audio file dependencies)
class DissectionAudioFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playIncisionTick(progress: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500 + progress * 600, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + progress * 260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380 + progress * 200, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay restrictions or context error
    }
  }

  playDissectionComplete() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.09, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch {
      // Audio autoplay restrictions or context error
    }
  }
}

// Google Drive file ID & Direct Download URL for External Human Body GLB
const DRIVE_GLB_ID = '1G5H2bggsYC9UJ2DGju_7L1HJ2UJEti4r';
const GOOGLE_DRIVE_GLB_URL = `https://drive.google.com/uc?export=download&id=${DRIVE_GLB_ID}`;
const LOCAL_GLB_FALLBACK_URL = '/models/human_base_mesh_01.glb';

export interface GuideCalibration {
  yOffset: number; // Vertical shift (meters)
  zOffset: number; // Skin depth offset (meters)
  lengthScale: number; // Length multiplier (0.8 - 1.2)
}

/**
 * Create anatomically accurate 3D Stomach (Gaster) model situated in the
 * epigastric and left hypochondriac region.
 * Its local origin (0, 0, 0) is placed at its anatomical central core so that
 * scale operations naturally expand and bloom smoothly from the center.
 */
function createAnatomicalStomach(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'anatomical_stomach';
  group.userData = {
    id: 'human_stomach',
    name: 'Muscular J-Stomach (Gaster)',
    region: 'epigastrium',
  };

  // Visceral gastric serosa material (deep crimson base with warm amber tones and realistic specular luster)
  const stomachMat = new THREE.MeshStandardMaterial({
    color: 0x9e1c1c,
    roughness: 0.36,
    metalness: 0.12,
  });

  // 1. Corpus (Main J-shaped central gastric reservoir centered at origin)
  const corpusGeo = new THREE.SphereGeometry(0.038, 28, 28);
  corpusGeo.scale(0.92, 1.38, 0.82);
  const corpusMesh = new THREE.Mesh(corpusGeo, stomachMat);
  corpusMesh.position.set(0, 0, 0); // Origin at central core
  corpusMesh.rotation.z = -0.28;
  corpusMesh.castShadow = true;
  corpusMesh.receiveShadow = true;
  group.add(corpusMesh);

  // 2. Fundus (Superior rounded dome situated under left diaphragm)
  const fundusGeo = new THREE.SphereGeometry(0.028, 24, 24);
  fundusGeo.scale(1.12, 1.05, 0.90);
  const fundusMesh = new THREE.Mesh(fundusGeo, stomachMat);
  fundusMesh.position.set(-0.012, 0.036, 0.002);
  fundusMesh.castShadow = true;
  group.add(fundusMesh);

  // 3. Pyloric Antrum & Pylorus (Tapering muscular exit leading medially to duodenum)
  const pylorusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.006, -0.032, 0.005),
    new THREE.Vector3(0.014, -0.036, 0.008),
    new THREE.Vector3(0.032, -0.028, 0.003),
  ]);
  const pylorusGeo = new THREE.TubeGeometry(pylorusCurve, 16, 0.013, 16, false);
  const pylorusMesh = new THREE.Mesh(pylorusGeo, stomachMat);
  pylorusMesh.castShadow = true;
  group.add(pylorusMesh);

  // 4. Greater Curvature Vascular Striation (Subtle gastric micro-ridges along greater curve)
  const rugaeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.006, 0.028, 0.024),
    new THREE.Vector3(-0.016, 0.004, 0.028),
    new THREE.Vector3(-0.008, -0.022, 0.022),
  ]);
  const rugaeGeo = new THREE.TubeGeometry(rugaeCurve, 16, 0.0016, 8, false);
  const rugaeMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.35,
    emissive: 0x9f1239,
    emissiveIntensity: 0.35,
  });
  const rugaeMesh = new THREE.Mesh(rugaeGeo, rugaeMat);
  group.add(rugaeMesh);

  // 5. Gastroepiploic Arterial Arcade (Branching vascular arcade along greater curvature)
  const vascularCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.018, 0.042, 0.006),
    new THREE.Vector3(-0.042, 0.012, 0.018),
    new THREE.Vector3(-0.038, -0.024, 0.022),
    new THREE.Vector3(-0.018, -0.045, 0.016),
    new THREE.Vector3(0.024, -0.034, 0.006),
  ]);
  const vascularGeo = new THREE.TubeGeometry(vascularCurve, 24, 0.0022, 8, false);
  const vascularMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    roughness: 0.3,
    emissive: 0x9f1239,
    emissiveIntensity: 0.45,
  });
  const vascularMesh = new THREE.Mesh(vascularGeo, vascularMat);
  group.add(vascularMesh);

  return group;
}

/**
 * Builds refined surgical incision geometry with:
 * 1. Moderately wider upper opening (epigastric notch ~52mm total opening)
 * 2. Smooth rounded superior entry apex fillet (no needle-like pointedness!)
 * 3. Smooth transition to the active scalpel cut point
 * 4. Subtle, non-graphic anatomical vascular red (hemostatic) margins conforming to surface
 */
function buildRefinedIncisionGeometries(
  curve: THREE.CatmullRomCurve3,
  progress: number
): { furrowGeo: THREE.BufferGeometry; hemoGeo: THREE.BufferGeometry } {
  const furrowGeo = new THREE.BufferGeometry();
  const hemoGeo = new THREE.BufferGeometry();

  if (progress <= 0.01) {
    return { furrowGeo, hemoGeo };
  }

  const segmentCount = Math.max(12, Math.ceil(progress * 48));
  const normal = new THREE.Vector3(0, 0, 1);

  const furrowPositions: number[] = [];
  const furrowIndices: number[] = [];

  const hemoPositions: number[] = [];
  const hemoIndices: number[] = [];

  const p0 = curve.getPointAt(0);
  const t0 = curve.getTangentAt(0).normalize();
  const lat0 = new THREE.Vector3().crossVectors(t0, normal).normalize();
  if (lat0.x < 0) lat0.negate();

  // Fix 3: Moderately wider upper aperture half-width (~26mm half-width, 52mm total opening)
  const wUpper = 0.026;

  // 1. Smooth rounded superior apex fillet (Fix 3: removes needle-like point)
  const arcSteps = 12;
  const apexCenter = p0.clone().add(new THREE.Vector3(0, 0.004, -0.002));
  const apexCenterIdx = 0;
  furrowPositions.push(apexCenter.x, apexCenter.y, apexCenter.z);

  const arcVertexIndices: number[] = [];
  for (let s = 0; s <= arcSteps; s++) {
    const theta = Math.PI - (s / arcSteps) * Math.PI; // Arc from left to right
    const arcX = Math.cos(theta) * wUpper;
    const arcY = Math.sin(theta) * (wUpper * 0.40);
    const arcPt = p0.clone().add(lat0.clone().multiplyScalar(arcX)).add(new THREE.Vector3(0, arcY, 0.002));
    const idx = furrowPositions.length / 3;
    furrowPositions.push(arcPt.x, arcPt.y, arcPt.z);
    arcVertexIndices.push(idx);

    if (s > 0) {
      furrowIndices.push(apexCenterIdx, arcVertexIndices[s - 1], idx);
    }
  }

  // 2. Traversed cut path down anterior midline
  // Each segment has 5 vertices across: [leftOuter, leftMid, deepCenter, rightMid, rightOuter]
  for (let i = 0; i <= segmentCount; i++) {
    const u = i / segmentCount;
    const pt = curve.getPointAt(u * progress);
    const tangent = curve.getTangentAt(u * progress).normalize();
    const lateral = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    if (lateral.x < 0) lateral.negate();

    // Smooth taper from wider upper opening down towards active cutting tip
    const baseHalfWidth = 0.0075 + (wUpper - 0.0075) * Math.pow(1 - u, 1.25);
    // Smooth visceral window dilation around epigastric stomach region (progress 0.05 - 0.50)
    const stomachFactor = Math.sin(Math.PI * Math.min(1, Math.max(0, (u * progress - 0.03) / 0.45)));
    const visceralBulge = progress > 0.05 ? 0.0055 * stomachFactor : 0;
    const halfWidth = baseHalfWidth + visceralBulge;

    const midWidth = halfWidth * 0.55;
    const depth = 0.008 * (1 - u * 0.45); // contoured depth along incision

    const leftOuter = pt.clone().sub(lateral.clone().multiplyScalar(halfWidth)).add(new THREE.Vector3(0, 0, 0.002));
    const leftMid = pt.clone().sub(lateral.clone().multiplyScalar(midWidth)).sub(new THREE.Vector3(0, 0, depth * 0.4));
    const deepCenter = pt.clone().sub(new THREE.Vector3(0, 0, depth));
    const rightMid = pt.clone().add(lateral.clone().multiplyScalar(midWidth)).sub(new THREE.Vector3(0, 0, depth * 0.4));
    const rightOuter = pt.clone().add(lateral.clone().multiplyScalar(halfWidth)).add(new THREE.Vector3(0, 0, 0.002));

    const rowStart = furrowPositions.length / 3;
    furrowPositions.push(leftOuter.x, leftOuter.y, leftOuter.z);
    furrowPositions.push(leftMid.x, leftMid.y, leftMid.z);
    furrowPositions.push(deepCenter.x, deepCenter.y, deepCenter.z);
    furrowPositions.push(rightMid.x, rightMid.y, rightMid.z);
    furrowPositions.push(rightOuter.x, rightOuter.y, rightOuter.z);

    if (i === 0) {
      // Seamless connection from rounded apex arc to first row of incision strip
      furrowIndices.push(arcVertexIndices[0], rowStart, rowStart + 1);
      furrowIndices.push(arcVertexIndices[0], rowStart + 1, apexCenterIdx);
      furrowIndices.push(apexCenterIdx, rowStart + 1, rowStart + 2);
      furrowIndices.push(apexCenterIdx, rowStart + 2, rowStart + 3);
      furrowIndices.push(apexCenterIdx, rowStart + 3, arcVertexIndices[arcSteps]);
      furrowIndices.push(arcVertexIndices[arcSteps], rowStart + 3, rowStart + 4);
    } else {
      const prevRow = rowStart - 5;
      for (let c = 0; c < 4; c++) {
        furrowIndices.push(prevRow + c, rowStart + c, prevRow + c + 1);
        furrowIndices.push(prevRow + c + 1, rowStart + c, rowStart + c + 1);
      }
    }

    // Fix 2: Subtle educational vascular crimson margins along active cut lips
    const hemoWidth = 0.0065; // ~6.5mm clearly visible yet restrained margin
    const hLeftOuter = leftOuter.clone().sub(lateral.clone().multiplyScalar(hemoWidth));
    const hLeftInner = leftOuter.clone().add(lateral.clone().multiplyScalar(0.001));
    const hRightInner = rightOuter.clone().sub(lateral.clone().multiplyScalar(0.001));
    const hRightOuter = rightOuter.clone().add(lateral.clone().multiplyScalar(hemoWidth));

    const hRow = hemoPositions.length / 3;
    hemoPositions.push(hLeftOuter.x, hLeftOuter.y, hLeftOuter.z + 0.001);
    hemoPositions.push(hLeftInner.x, hLeftInner.y, hLeftInner.z + 0.001);
    hemoPositions.push(hRightInner.x, hRightInner.y, hRightInner.z + 0.001);
    hemoPositions.push(hRightOuter.x, hRightOuter.y, hRightOuter.z + 0.001);

    if (i > 0) {
      const prevH = hRow - 4;
      // Left vascular band
      hemoIndices.push(prevH, hRow, prevH + 1);
      hemoIndices.push(prevH + 1, hRow, hRow + 1);
      // Right vascular band
      hemoIndices.push(prevH + 2, hRow + 2, prevH + 3);
      hemoIndices.push(prevH + 3, hRow + 2, hRow + 3);
    }

    // Active cutting tip vascular cap: connect lips around leading apex of scalpel
    if (i === segmentCount) {
      const tipCapPt = pt.clone().add(tangent.clone().multiplyScalar(0.005)).add(new THREE.Vector3(0, 0, 0.002));
      const tipCapIdx = hemoPositions.length / 3;
      hemoPositions.push(tipCapPt.x, tipCapPt.y, tipCapPt.z);
      hemoIndices.push(hRow, tipCapIdx, hRow + 1);
      hemoIndices.push(hRow + 2, tipCapIdx, hRow + 3);
    }
  }

  furrowGeo.setAttribute('position', new THREE.Float32BufferAttribute(furrowPositions, 3));
  furrowGeo.setIndex(furrowIndices);
  furrowGeo.computeVertexNormals();

  hemoGeo.setAttribute('position', new THREE.Float32BufferAttribute(hemoPositions, 3));
  hemoGeo.setIndex(hemoIndices);
  hemoGeo.computeVertexNormals();

  return { furrowGeo, hemoGeo };
}

interface ExternalBodyDissectionViewerProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExploreInternalOrgans: () => void;
  dissectionState: DissectionState;
  setDissectionState: (state: DissectionState) => void;
  progress: number;
  setProgress: (p: number | ((prev: number) => number)) => void;
  onResetDissection: () => void;
}

const ExternalBodyDissectionViewer: React.FC<ExternalBodyDissectionViewerProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onExploreInternalOrgans,
  dissectionState,
  setDissectionState,
  progress,
  setProgress,
  onResetDissection,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const guideGroupRef = useRef<THREE.Group | null>(null);
  const probeMeshRef = useRef<THREE.Group | null>(null);
  const progressTubeRef = useRef<THREE.Mesh | null>(null);
  const incisionHemoRef = useRef<THREE.Mesh | null>(null);
  const activeHemoHaloRef = useRef<THREE.Mesh | null>(null);
  const stomachGroupRef = useRef<THREE.Group | null>(null);
  const raycastHitPlaneRef = useRef<THREE.Mesh | null>(null);
  const audioFXRef = useRef<DissectionAudioFX>(new DissectionAudioFX());

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string>('Google Drive Direct GLB');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<{ triangles: number; meshes: number } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [showHudCollapsed, setShowHudCollapsed] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isKeyboardActive, setIsKeyboardActive] = useState<boolean>(false);
  const positionGroupRef = useRef<THREE.Group | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
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

  // Guide Calibration State (Satisfies Section 3 manual alignment configuration)
  const [calibration, setCalibration] = useState<GuideCalibration>({
    yOffset: 0.0,
    zOffset: 0.008,
    lengthScale: 1.0,
  });

  // Track dragging state directly in ref for high-fps raycasting without react re-render stalls
  const isDraggingGuideRef = useRef<boolean>(false);
  const lastProgressRef = useRef<number>(progress);
  lastProgressRef.current = progress;

  // Build the 3D Catmull-Rom Curve along the anterior abdominal midline
  const buildGuideCurve = useCallback(
    (calib: GuideCalibration) => {
      const yLen = 0.24 * calib.lengthScale;
      const topY = 0.12 * calib.lengthScale + calib.yOffset;
      const midY = 0.0 + calib.yOffset;
      const botY = -0.12 * calib.lengthScale + calib.yOffset;
      const zOff = calib.zOffset;

      const points = [
        new THREE.Vector3(0, topY, 0.148 + zOff),          // Epigastrium (superior margin, below sternum)
        new THREE.Vector3(0, topY * 0.5, 0.141 + zOff),    // Upper umbilical abdomen
        new THREE.Vector3(0, midY, 0.134 + zOff),          // Umbilicus (navel landmark)
        new THREE.Vector3(0, botY * 0.5, 0.114 + zOff),    // Lower umbilical / hypogastrium
        new THREE.Vector3(0, botY, 0.096 + zOff),          // Suprapubic boundary (inferior limit)
      ];

      return new THREE.CatmullRomCurve3(points);
    },
    []
  );

  // Toggle Sound FX
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioFXRef.current.enabled = !next;
  };

  // Reset Camera View to frame the torso
  const handleResetCamera = () => {
    if (!controlsRef.current || !modelGroupRef.current || !cameraRef.current) return;
    const box = new THREE.Box3().setFromObject(modelGroupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 2;
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.35;

    cameraRef.current.position.set(0, 0.02, cameraZ);
    controlsRef.current.reset(cameraZ, Math.PI / 2, Math.PI / 2.05, new THREE.Vector3(0, 0, 0));
  };

  // Toggle Wireframe Mesh
  const handleToggleWireframe = () => {
    const next = !isWireframe;
    setIsWireframe(next);
    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => (m.wireframe = next));
          } else if (child.material) {
            child.material.wireframe = next;
          }
        }
      });
    }
  };

  // Step-by-step progress advance (+25%) for accessibility and keyboard users
  const handleAdvanceStep = () => {
    if (dissectionState === 'IDLE') {
      setDissectionState('GUIDE_READY');
    }
    const nextProgress = Math.min(1.0, Math.round((progress + 0.25) * 100) / 100);
    handleProgressUpdate(nextProgress);
  };

  // Unified Progress Update Handler
  const handleProgressUpdate = (newVal: number) => {
    const clamped = Math.max(0, Math.min(1, newVal));
    setProgress(clamped);

    // Audio feedback
    if (Math.abs(clamped - lastProgressRef.current) > 0.03) {
      audioFXRef.current.playIncisionTick(clamped);
    }

    if (clamped >= 0.99) {
      setDissectionState('INTERACTION_COMPLETE');
      setShowCompletionModal(false);
      audioFXRef.current.playDissectionComplete();
      onExploreInternalOrgans();
    } else if (clamped > 0) {
      setDissectionState('INTERACTION_ACTIVE');
    }
  };

  // Update 3D Visual elements based on progress and calibration
  useEffect(() => {
    if (!guideGroupRef.current) return;

    const curve = buildGuideCurve(calibration);

    // 1. Update Probe Position in 3D
    if (probeMeshRef.current) {
      const probePoint = curve.getPointAt(progress);
      probeMeshRef.current.position.copy(probePoint);
      probeMeshRef.current.visible = dissectionState !== 'IDLE';
    }

    // 2. Update Refined Incision Furrow & Vascular Red Feedback (Fix 2 & Fix 3)
    if (progressTubeRef.current && incisionHemoRef.current) {
      if (progress <= 0.01 || dissectionState === 'IDLE') {
        progressTubeRef.current.visible = false;
        incisionHemoRef.current.visible = false;
        if (activeHemoHaloRef.current) {
          activeHemoHaloRef.current.visible = false;
        }
      } else {
        progressTubeRef.current.visible = true;
        incisionHemoRef.current.visible = true;

        const { furrowGeo, hemoGeo } = buildRefinedIncisionGeometries(curve, progress);
        const oldFurrow = progressTubeRef.current.geometry;
        progressTubeRef.current.geometry = furrowGeo;
        if (oldFurrow) oldFurrow.dispose();

        const oldHemo = incisionHemoRef.current.geometry;
        incisionHemoRef.current.geometry = hemoGeo;
        if (oldHemo) oldHemo.dispose();

        // Active cutting tip vascular highlight (Fix 2)
        if (activeHemoHaloRef.current) {
          const activeTipPt = curve.getPointAt(progress);
          const activeTangent = curve.getTangentAt(progress).normalize();
          activeHemoHaloRef.current.position.copy(activeTipPt).add(new THREE.Vector3(0, 0, 0.0025));
          activeHemoHaloRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), activeTangent);
          activeHemoHaloRef.current.visible = dissectionState === 'INTERACTION_ACTIVE';
        }
      }
    }

    // 3. Stomach Region Expansion from Central Region (Fix 1)
    if (stomachGroupRef.current) {
      if (progress <= 0.02 || dissectionState === 'IDLE') {
        stomachGroupRef.current.visible = false;
        stomachGroupRef.current.scale.set(0.001, 0.001, 0.001);
      } else {
        // Epigastric / stomach region spans progress ~0.04 to ~0.52
        const tStomach = Math.min(1, Math.max(0, (progress - 0.04) / 0.42));
        const sEase = tStomach * tStomach * (3 - 2 * tStomach); // smoothstep curve
        // Blooms smoothly and radially outward from central origin
        const stomachScale = 0.15 + 0.85 * sEase;
        stomachGroupRef.current.visible = true;
        stomachGroupRef.current.scale.set(stomachScale, stomachScale, stomachScale);
        stomachGroupRef.current.position.set(
          -0.030 + sEase * 0.004,
          0.075,
          0.128 + sEase * 0.024 // emerges visibly forward through opened incision aperture
        );
      }
    }
  }, [progress, calibration, dissectionState, buildGuideCurve]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -2.2, {
      includeStagePlatform: false,
      includeGroundStage: false,
    });

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 0.6,
      maxDistance: 8,
    });
    controlsRef.current = controls;

    // Professional Scientific Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.92);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.68);
    fillLight.position.set(-4, -1, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Subtle Grid Floor
    const grid = new THREE.GridHelper(8, 20, 0x38bdf8, 0x334155);
    styleStudioGridHelper(grid);
    grid.position.y = -1.15;
    scene.add(grid);

    // Universal Position Parent Group
    const positionGroup = new THREE.Group();
    positionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    positionGroupRef.current = positionGroup;
    scene.add(positionGroup);

    // Main Model Group
    const modelGroup = new THREE.Group();
    positionGroup.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Dedicated Guide & Dissection Group (Parented to modelGroup so it rotates with body!)
    const guideGroup = new THREE.Group();
    modelGroup.add(guideGroup);
    guideGroupRef.current = guideGroup;

    // Build Initial Guide Geometry
    const curve = buildGuideCurve(calibration);

    // A. Base Guide Tube (Subtle cyan line)
    const baseTubeGeo = new THREE.TubeGeometry(curve, 32, 0.0035, 8, false);
    const baseTubeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.1,
    });
    const baseTubeMesh = new THREE.Mesh(baseTubeGeo, baseTubeMat);
    guideGroup.add(baseTubeMesh);

    // B. Anatomical Stomach Organ (Fix 1: Stomach Region Expansion from central core)
    const stomachGroup = createAnatomicalStomach();
    stomachGroup.position.set(-0.030, 0.075, 0.130);
    stomachGroup.scale.set(0.001, 0.001, 0.001);
    stomachGroup.visible = false;
    stomachGroup.renderOrder = 2;
    guideGroup.add(stomachGroup);
    stomachGroupRef.current = stomachGroup;

    // C. Refined Incision Furrow (Fix 3: wider upper opening & smooth transition)
    const progTubeGeo = new THREE.BufferGeometry();
    const progTubeMat = new THREE.MeshStandardMaterial({
      color: 0x3d1308, // deep subdermal fascia bed
      roughness: 0.52,
      metalness: 0.06,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const progTubeMesh = new THREE.Mesh(progTubeGeo, progTubeMat);
    progTubeMesh.visible = false;
    guideGroup.add(progTubeMesh);
    progressTubeRef.current = progTubeMesh;

    // D. Incision Vascular Red Margins (Fix 2: subtle educational non-graphic hemostatic response)
    const hemoGeo = new THREE.BufferGeometry();
    const hemoMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // deep anatomical venous/capillary ruby
      emissive: 0x4c0519,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const hemoMesh = new THREE.Mesh(hemoGeo, hemoMat);
    hemoMesh.visible = false;
    guideGroup.add(hemoMesh);
    incisionHemoRef.current = hemoMesh;

    // E. Active Cutting Tip Capillary Halo (Fix 2: surface-conforming localized vascular feedback)
    const haloGeo = new THREE.RingGeometry(0.003, 0.009, 24);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0x9f1239,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    guideGroup.add(haloMesh);
    activeHemoHaloRef.current = haloMesh;

    // C. Waypoint Markers (Start ring, Navel ring, End ring)
    const startPt = curve.getPointAt(0);
    const midPt = curve.getPointAt(0.5);
    const endPt = curve.getPointAt(1);

    // Start Waypoint Marker (Epigastrium)
    const startRingGeo = new THREE.TorusGeometry(0.012, 0.002, 8, 24);
    const startRingMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
    });
    const startRing = new THREE.Mesh(startRingGeo, startRingMat);
    startRing.position.copy(startPt);
    guideGroup.add(startRing);

    // Navel Landmark Dot (Umbilicus)
    const navelDotGeo = new THREE.SphereGeometry(0.005, 12, 12);
    const navelDotMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
    });
    const navelDot = new THREE.Mesh(navelDotGeo, navelDotMat);
    navelDot.position.copy(midPt);
    guideGroup.add(navelDot);

    // End Waypoint Marker (Suprapubic)
    const endRingGeo = new THREE.TorusGeometry(0.012, 0.002, 8, 24);
    const endRingMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
    });
    const endRing = new THREE.Mesh(endRingGeo, endRingMat);
    endRing.position.copy(endPt);
    guideGroup.add(endRing);

    // D. 3D Virtual Dissection Tool (Abstract educational optical probe cursor)
    const probeGroup = new THREE.Group();
    // Probe handle shaft (High-tech surgical titanium alloy)
    const shaftGeo = new THREE.CylinderGeometry(0.004, 0.0025, 0.075, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(0, 0.04, 0.02);
    shaftMesh.rotation.x = Math.PI / 4;
    probeGroup.add(shaftMesh);

    // Probe optical ring
    const ringGeo = new THREE.TorusGeometry(0.006, 0.0015, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.02, 0.01);
    ringMesh.rotation.x = Math.PI / 4;
    probeGroup.add(ringMesh);

    // Optical Emitter Tip (Luminous focal point)
    const tipGeo = new THREE.SphereGeometry(0.0045, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    probeGroup.add(tipMesh);

    // Subtle localized optical focal light
    const tipLight = new THREE.PointLight(0x06b6d4, 0.5, 0.2);
    probeGroup.add(tipLight);

    probeGroup.position.copy(startPt);
    guideGroup.add(probeGroup);
    probeMeshRef.current = probeGroup;

    // E. Raycasting Collision Proxy Plane (Attached right over anterior abdomen)
    const hitPlaneGeo = new THREE.PlaneGeometry(0.28, 0.38);
    const hitPlaneMat = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    const hitPlane = new THREE.Mesh(hitPlaneGeo, hitPlaneMat);
    hitPlane.position.set(0, 0.0, 0.138);
    guideGroup.add(hitPlane);
    raycastHitPlaneRef.current = hitPlane;

    // Load the 3D GLB Model
    const loader = new GLTFLoader();

    const processLoadedGltf = (gltf: any, sourceName: string) => {
      const loadedScene = gltf.scene || gltf.scenes[0];

      let triangleCount = 0;
      let meshCount = 0;

      loadedScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          if (child.geometry) {
            triangleCount += child.geometry.index
              ? child.geometry.index.count / 3
              : child.geometry.attributes.position.count / 3;
          }
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                if (!mat.map) {
                  mat.color = new THREE.Color(0xd9a07a);
                  mat.roughness = 0.65;
                  mat.metalness = 0.05;
                }
              } else if (mat instanceof THREE.MeshPhongMaterial) {
                if (!mat.map) {
                  mat.color = new THREE.Color(0xd9a07a);
                }
              }
            });
          }
        }
      });

      setModelStats({ triangles: Math.round(triangleCount), meshes: meshCount });
      modelGroup.add(loadedScene);

      // Center geometry bounding box exactly
      const box = new THREE.Box3().setFromObject(loadedScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      loadedScene.position.sub(center);

      // Frame camera properly to highlight the torso and abdominal region
      const maxDim = Math.max(size.x, size.y, size.z) || 2;
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.35;

      camera.position.set(0, 0.02, cameraZ);
      controls.target.set(0, 0, 0);
      controls.reset(cameraZ, Math.PI / 2, Math.PI / 2.05, new THREE.Vector3(0, 0, 0));

      setLoading(false);
      setLoadError(null);
      setActiveSource(sourceName);
    };

    setLoading(true);
    loader.load(
      GOOGLE_DRIVE_GLB_URL,
      (gltf) => {
        processLoadedGltf(gltf, 'Google Drive GLB (1G5H2bggsYC9UJ2DGju_7L1HJ2UJEti4r)');
      },
      undefined,
      (err) => {
        console.warn('Google Drive direct load fallback to local GLB asset:', err);
        loader.load(
          LOCAL_GLB_FALLBACK_URL,
          (gltfFallback) => {
            processLoadedGltf(gltfFallback, 'Google Drive GLB Asset (/models/human_base_mesh_01.glb)');
          },
          undefined,
          (fallbackErr) => {
            console.error('Both primary and local GLB loads failed:', fallbackErr);
            setLoading(false);
            setLoadError('Failed to parse 3D GLB binary. Check network permissions.');
          }
        );
      }
    );

    // Raycasting Setup for Pointer & Touch Events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerInteraction = (clientX: number, clientY: number, isStarting: boolean) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (!raycastHitPlaneRef.current || !guideGroupRef.current) return false;

      const intersects = raycaster.intersectObject(raycastHitPlaneRef.current, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        // Convert hit point into guideGroup local coordinates
        const localHit = guideGroupRef.current.worldToLocal(hit.point.clone());

        // Check if pointer is within the abdominal midline tolerance (±0.075m)
        if (Math.abs(localHit.x) <= 0.075) {
          const topY = 0.12 * calibration.lengthScale + calibration.yOffset;
          const botY = -0.12 * calibration.lengthScale + calibration.yOffset;
          const span = topY - botY;
          const calculatedProgress = (topY - localHit.y) / span;

          if (isStarting) {
            // If starting near the top (<= 0.35) or near current progress, activate drag
            if (calculatedProgress <= Math.max(0.35, lastProgressRef.current + 0.2)) {
              isDraggingGuideRef.current = true;
              controls.enabled = false; // Disable orbit controls to prevent camera jerk
              handleProgressUpdate(calculatedProgress);
              return true;
            }
          } else if (isDraggingGuideRef.current) {
            // Dragging: progress can only advance forward smoothly (with minor slack)
            if (calculatedProgress >= lastProgressRef.current - 0.08) {
              handleProgressUpdate(calculatedProgress);
            }
            return true;
          }
        }
      }
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only capture dissection interaction when dissection mode is active
      if (dissectionStateRef.current !== 'IDLE') {
        const handled = handlePointerInteraction(e.clientX, e.clientY, true);
        if (handled) {
          e.stopPropagation();
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingGuideRef.current) {
        handlePointerInteraction(e.clientX, e.clientY, false);
      }
    };

    const onPointerUp = () => {
      if (isDraggingGuideRef.current) {
        isDraggingGuideRef.current = false;
        controls.enabled = true; // Re-enable orbit controls
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Gentle auto-rotation when not interacting and enabled
      if (autoRotate && !controls.isPointerDown && !isDraggingGuideRef.current && modelGroup) {
        modelGroup.rotation.y += 0.003;
      }

      // Pulse probe focal light when in GUIDE_READY or INTERACTION_ACTIVE
      if (probeMeshRef.current && dissectionStateRef.current !== 'IDLE') {
        const time = Date.now() * 0.004;
        tipLight.intensity = 0.5 + Math.sin(time) * 0.2;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      if (progressTubeRef.current?.geometry) progressTubeRef.current.geometry.dispose();
      if (incisionHemoRef.current?.geometry) incisionHemoRef.current.geometry.dispose();
      if (activeHemoHaloRef.current?.geometry) activeHemoHaloRef.current.geometry.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      studioEnv.dispose();
      renderer.dispose();
    };
  }, []); // Run once on mount

  // Keep dissectionState ref updated for event handlers
  const dissectionStateRef = useRef<DissectionState>(dissectionState);
  dissectionStateRef.current = dissectionState;

  // Toggle Dissection Mode Button
  const handleToggleDissectionMode = () => {
    if (dissectionState === 'IDLE') {
      setDissectionState('GUIDE_READY');
      handleResetCamera(); // Align view to abdominal guide
    } else {
      setDissectionState('IDLE');
      if (controlsRef.current) controlsRef.current.enabled = true;
      isDraggingGuideRef.current = false;
    }
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 w-full">
      <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[660px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
        {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        className={`w-full h-full flex-1 ${
          dissectionState !== 'IDLE' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* TOP HEADER CONTROLS RIBBON */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-bold text-white shadow-md flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">External Human Specimen</span>
            <span className="sm:hidden">Human Body</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 font-mono">
              3D GLB
            </span>
          </div>

          {/* Mode Pill */}
          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              dissectionState === 'IDLE'
                ? 'bg-slate-900/80 text-slate-300 border-slate-700'
                : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            {dissectionState === 'IDLE' ? 'Orbit & Zoom Mode' : 'Virtual Dissection Active'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Direct Transition Action Button */}
          <button
            onClick={onExploreInternalOrgans}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-950/40 ring-1 ring-rose-400/40 transition-all cursor-pointer"
            title="Explore Internal Organs (Sketchfab Viewer)"
          >
            <Heart className="w-3.5 h-3.5 text-rose-200 fill-rose-300" />
            <span className="hidden sm:inline">Explore Internal Organs</span>
            <span className="sm:hidden">Organs</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-200" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => setShowCalibration((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showCalibration
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Calibrate Guide Alignment & Position"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleWireframe}
            className={`hidden sm:inline-flex px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isWireframe
                ? 'bg-sky-600 text-white border-sky-400'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Wireframe Mesh"
          >
            {isWireframe ? 'Skin' : 'Wireframe'}
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Reset Camera Framing"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D FLOATING CALLOUT ANNOTATION (Static scientific label) */}
      <div className="absolute top-16 left-3 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-sm border border-cyan-500/40 rounded-xl px-3 py-2 text-[11px] text-cyan-200 shadow-xl max-w-[240px] space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Virtual Dissection Guide</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Anterior abdominal midline (linea alba). Educational demonstration, not clinical surgery.
          </p>
        </div>
      </div>

      {/* CALIBRATION / ALIGNMENT POPUP (Manual alignment configuration) */}
      {showCalibration && (
        <div className="absolute top-16 right-3 z-20 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/40 p-4 shadow-2xl text-xs text-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Guide Alignment Settings
            </span>
            <button
              onClick={() => setShowCalibration(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Vertical Shift (Y)</span>
                <span className="font-mono text-cyan-300">{calibration.yOffset.toFixed(3)}m</span>
              </div>
              <input
                type="range"
                min="-0.06"
                max="0.06"
                step="0.005"
                value={calibration.yOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, yOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Skin Offset (Z depth)</span>
                <span className="font-mono text-cyan-300">{calibration.zOffset.toFixed(3)}m</span>
              </div>
              <input
                type="range"
                min="0.002"
                max="0.025"
                step="0.002"
                value={calibration.zOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, zOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Guide Length Scale</span>
                <span className="font-mono text-cyan-300">{calibration.lengthScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.25"
                step="0.05"
                value={calibration.lengthScale}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, lengthScale: parseFloat(e.target.value) }))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => setCalibration({ yOffset: 0.0, zOffset: 0.008, lengthScale: 1.0 })}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Reset to Anatomical Default
          </button>
        </div>
      )}

      {/* COMPLETION MODAL OVERLAY (Section 6: Non-graphic educational reveal) */}
      {showCompletionModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Virtual Incision Simulated
                </span>
                <h3 className="text-lg font-bold text-white">Demonstration Complete</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The anterior abdominal wall demonstration path along the linea alba has been fully traversed (100%).
              Reflecting this tissue layer unlocks observation of the coelomic cavity and visceral organ systems.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Scientific Transparency Notice:</span>
              <p>
                The deep human internal organs are hosted in an interactive, separate 3D dataset by unlim3d.
                Click below to transition to the interactive visceral inspection suite.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  onExploreInternalOrgans();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 font-bold text-xs text-white shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-200 fill-rose-300" />
                <span>Explore Internal Organs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowCompletionModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Review Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Three.js Skill Directive) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-3 sm:p-4 space-y-3">
          {/* Top Row: State Indicator & Toggle Collapse */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleDissectionMode}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dissectionState === 'IDLE'
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {dissectionState === 'IDLE' ? 'Enable Virtual Dissection' : 'Dissection Mode Active'}
                </span>
              </button>

              <span className="text-slate-500 text-xs hidden sm:inline">|</span>

              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {dissectionState === 'IDLE' && 'Click Enable to activate the abdominal guide.'}
                {dissectionState === 'GUIDE_READY' && 'Drag probe from top start marker downward along cyan guide.'}
                {dissectionState === 'INTERACTION_ACTIVE' && `Progress: ${Math.round(progress * 100)}% traversed.`}
                {dissectionState === 'INTERACTION_COMPLETE' && 'Complete! Internal organs unlocked.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onResetDissection}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                title="Reset Demonstration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={() => setShowHudCollapsed((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                title={showHudCollapsed ? 'Expand Dock' : 'Collapse Dock'}
              >
                {showHudCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Body */}
          {!showHudCollapsed && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              {/* Progress Bar & Landmarks */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Abdominal Linea Alba Guide</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {Math.round(progress * 100)}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-75"
                    style={{ width: `${progress * 100}%` }}
                  />
                  {/* Landmark ticks */}
                  <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-40">
                    <span className="w-0.5 h-full bg-white/40" />
                    <span className="w-0.5 h-full bg-white/40" />
                    <span className="w-0.5 h-full bg-white/40" />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Start (Epigastrium)</span>
                  <span>Mid (Umbilicus)</span>
                  <span>End (Suprapubic)</span>
                </div>
              </div>

              {/* Tactile Scrubber & Accessibility Stepping Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <div className="w-full flex-1 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                    Tactile Probe Scrubber:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(progress * 100)}
                    onChange={(e) => {
                      if (dissectionState === 'IDLE') setDissectionState('GUIDE_READY');
                      handleProgressUpdate(parseInt(e.target.value, 10) / 100);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleAdvanceStep}
                  disabled={progress >= 1.0}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 font-semibold text-xs transition-colors cursor-pointer shrink-0 border border-slate-700"
                >
                  +25% Incision Step
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white gap-3 p-6 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-200">Loading External Human Body 3D Model...</span>
            <p className="text-[11px] text-slate-400">Loading Google Drive GLB asset (ID: {DRIVE_GLB_ID})</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h4 className="text-sm font-bold text-rose-300">Failed to Load GLB Model</h4>
          <p className="text-xs text-slate-400 max-w-sm">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer shadow-md"
          >
            Retry Load
          </button>
        </div>
      )}
      </div>

      {/* Universal 3D Model Position Controls (Directly BELOW the 3D Viewer) */}
      <ModelPositionControls
        position={modelPosition}
        onChange={setModelPosition}
        onReset={() => setModelPosition({ x: 0, y: 0 })}
        range={{ minX: -2.5, maxX: 2.5, minY: -2.5, maxY: 2.5, step: 0.05 }}
        isKeyboardActive={isKeyboardActive}
        onToggleKeyboardActive={setIsKeyboardActive}
      />
    </div>
  );
};

interface InternalOrgansEmbedViewerProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onReturnToExternalBody: () => void;
}

const InternalOrgansEmbedViewer: React.FC<InternalOrgansEmbedViewerProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onReturnToExternalBody,
}) => {
  return (
    <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[660px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Controls Overlay Ribbon */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* TOP EXTREME LEFT: Tech-Anatomix Logo */}
        <div className="pointer-events-auto">
          <img
            src="/logo.png"
            alt="Tech-Anatomix Logo"
            className="w-9 h-9 object-contain rounded-lg shadow-md drop-shadow bg-slate-900/60 p-1 backdrop-blur-xs border border-slate-700/50"
          />
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onReturnToExternalBody}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to External Body</span>
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sketchfab Embed Iframe with Native Interactive Controls */}
      <div className="w-full h-full flex-1 relative bg-slate-950">
        <iframe
          title="Human Internal Organs"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src="https://sketchfab.com/models/fe69d7b1ed6f46a3bd0b6933b796092e/embed?autostart=1&camera=0&transparent=1"
          className="w-full h-full block min-h-[440px] border-0 rounded-2xl"
        />
      </div>
    </div>
  );
};

export const HumanAnatomyExplorer: React.FC = () => {
  // Master Single Active Viewer State
  const [activeView, setActiveView] = useState<'external' | 'internal'>('external');
  const [dissectionState, setDissectionState] = useState<DissectionState>('IDLE');
  const [progress, setProgress] = useState<number>(0.0);
  const [selectedOrganId, setSelectedOrganId] = useState<string>('human_heart');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Graceful Transition from External to Internal Organs Viewer
  const handleTransitionToInternal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView('internal');
      setDissectionState('ORGANS_REVEALED');
      setIsTransitioning(false);
    }, 450);
  };

  // Return to External Body View
  const handleReturnToExternal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView('external');
      setIsTransitioning(false);
    }, 350);
  };

  // Full Reset Demonstration Handler (Section 9)
  const handleResetDemonstration = () => {
    setProgress(0.0);
    setDissectionState('IDLE');
    setActiveView('external');
  };

  const selectedOrgan = HUMAN_ORGAN_LIST.find((o) => o.id === selectedOrganId) || HUMAN_ORGAN_LIST[0];

  return (
    <HumanViewerErrorBoundary onReset={handleResetDemonstration}>
      <div
        ref={containerRef}
        className={`w-full flex flex-col gap-6 bg-slate-900 text-slate-100 ${
          isFullscreen
            ? 'fixed inset-0 z-50 p-6 overflow-y-auto bg-slate-950'
            : 'p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl'
        }`}
      >
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  activeView === 'external'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                {activeView === 'external' ? 'External Body Specimen' : 'Internal Visceral Organs'}
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-rose-300 font-semibold italic">Dissect Your Cell!</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeView === 'external'
                ? 'Human Anatomy Explorer — Virtual Dissection Suite'
                : 'Explore the Internal Organs (Coelomic Visceral Specimen)'}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {activeView === 'external'
                ? 'Inspect external musculoskeletal morphology in 3D. Activate the virtual dissection tool to simulate the abdominal midline incision and unlock internal viscera.'
                : 'Interactive 3D internal organs specimen (Sketchfab embed by unlim3d). Inspect the 4-chambered heart, lobar lungs, liver, stomach, and kidneys with native controls.'}
            </p>
          </div>

          {/* Switcher & Reset Ribbon */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveView('external')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'external'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>External Body</span>
            </button>

            <button
              onClick={() => {
                setActiveView('internal');
                setDissectionState('ORGANS_REVEALED');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'internal'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Internal Organs</span>
            </button>

            <button
              onClick={handleResetDemonstration}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              title="Reset Virtual Dissection Demonstration"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transition Flash Banner */}
        {isTransitioning && (
          <div className="w-full p-4 rounded-xl bg-slate-950 border border-cyan-500/40 text-center text-cyan-300 text-xs font-semibold animate-pulse">
            Switching viewing mode... Initializing high-resolution anatomical view.
          </div>
        )}

        {/* SINGLE ACTIVE VIEWER AREA */}
        <div className="w-full">
          {activeView === 'external' ? (
            <ExternalBodyDissectionViewer
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onExploreInternalOrgans={handleTransitionToInternal}
              dissectionState={dissectionState}
              setDissectionState={setDissectionState}
              progress={progress}
              setProgress={setProgress}
              onResetDissection={handleResetDemonstration}
            />
          ) : (
            <InternalOrgansEmbedViewer
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onReturnToExternalBody={handleReturnToExternal}
            />
          )}
        </div>

        {/* Organ Systems Interactive Dossier */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                <span>Human Organ Systems Dossier</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed anatomical locations, biological functions, and clinical notes for key visceral organ systems.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {HUMAN_ORGAN_LIST.map((organ) => {
                const isSelected = selectedOrganId === organ.id;
                return (
                  <button
                    key={organ.id}
                    onClick={() => setSelectedOrganId(organ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs border border-rose-500'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: organ.color }}
                    />
                    <span>{organ.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Organ Detail Card */}
          {selectedOrgan && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedOrgan.color }}
                  />
                  <h4 className="text-sm font-bold text-white">{selectedOrgan.name}</h4>
                  <span className="text-xs italic text-slate-400">({selectedOrgan.scientificName})</span>
                  <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 ml-auto">
                    {selectedOrgan.system}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedOrgan.function}</p>

                <div className="pt-2 text-xs text-slate-400 flex items-start gap-1.5">
                  <span className="font-semibold text-slate-300 shrink-0">Clinical Significance:</span>
                  <span>{selectedOrgan.clinicalSignificance}</span>
                </div>
              </div>

              <div className="md:col-span-4 p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                    Anatomical Location
                  </span>
                  <span className="text-slate-200 mt-0.5 block">{selectedOrgan.location}</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                    Comparative Physiology
                  </span>
                  <span className="text-slate-400 mt-0.5 block leading-relaxed">
                    Four-chambered heart with complete interventricular septum and negative pressure thoracic respiration.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HumanViewerErrorBoundary>
  );
};
