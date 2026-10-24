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
import { soundEngine } from '../../utils/soundEngine';

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

// Unified State-Driven Dissection Audio Bridge
class DissectionAudioFX {
  public enabled: boolean = true;

  playIncisionTick(progress: number, velocity = 1.0) {
    if (!this.enabled) return;
    soundEngine.playSurgicalIncision({
      sourceId: 'human-anatomy-dissection',
      progress,
      velocity,
    });
  }

  playDissectionComplete() {
    if (!this.enabled) return;
    soundEngine.playUiFeedback('dissection_complete', `human_dissection_complete_${Date.now()}`);
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
 * Generates a soft-feathered procedural 2D CanvasTexture for realistic wet vascular fluid
 * seepage along the incised skin margins, eliminating hard polygon edges.
 */
function createVascularDiffusionTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const data = imgData.data;

  for (let y = 0; y < canvas.height; y++) {
    const v = y / (canvas.height - 1);
    // Wide organic multi-frequency capillary wave along incision length
    const wave =
      0.86 +
      0.08 * Math.sin(v * Math.PI * 12.0) +
      0.06 * Math.cos(v * Math.PI * 27.0) +
      0.04 * Math.sin(v * Math.PI * 49.0);

    for (let x = 0; x < canvas.width; x++) {
      // u = 0 is inner incised dermal lip; u = 1 is outer spreading capillary margin on skin
      const u = x / (canvas.width - 1);
      const idx = (y * canvas.width + x) * 4;

      const normU = u / Math.max(0.45, wave);
      if (normU >= 1.0) {
        data[idx] = 135;
        data[idx + 1] = 10;
        data[idx + 2] = 18;
        data[idx + 3] = 0;
      } else {
        // Thick, lush venous-arterial crimson across 75% of the width, feathering smoothly at outer edge
        const coreMix = Math.min(1, normU / 0.55);
        const r = Math.round(135 + 82 * coreMix - 28 * Math.pow(normU, 2));
        const g = Math.round(8 + 16 * (1 - normU));
        const b = Math.round(14 + 20 * (1 - normU));
        const edgeT = Math.max(0, (normU - 0.72) / 0.28);
        const alpha = normU < 0.72
          ? 1.0 - 0.08 * normU
          : 0.94 * Math.pow(1 - edgeT, 1.65);

        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Zone 1 Organ (Upper/Mid Sternal Cut): Beating Crimson Heart Myocardium & Coronary Vessels (Cor)
 */
function createThoracicHeartOrgan(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'thoracic_heart_organ';

  const myocardiumMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    emissive: 0x450a0a,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.08,
  });

  // Left & Right Ventricular Myocardial Cone centered at origin
  const ventricleGeo = new THREE.SphereGeometry(0.0115, 24, 24);
  ventricleGeo.scale(0.86, 1.35, 0.76);
  const ventricleMesh = new THREE.Mesh(ventricleGeo, myocardiumMat);
  ventricleMesh.rotation.z = 0.22;
  group.add(ventricleMesh);

  // Superior Aortic / Pulmonary Root Arch
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.008, 0.002),
    new THREE.Vector3(0.002, 0.016, 0.003),
    new THREE.Vector3(-0.002, 0.021, 0.001),
  ]);
  const aortaGeo = new THREE.TubeGeometry(aortaCurve, 14, 0.0036, 12, false);
  const aortaMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.4,
    roughness: 0.24,
  });
  group.add(new THREE.Mesh(aortaGeo, aortaMat));

  // Anterior Interventricular Coronary Artery (LAD)
  const ladCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.001, 0.010, 0.008),
    new THREE.Vector3(-0.002, 0.001, 0.009),
    new THREE.Vector3(-0.004, -0.009, 0.007),
  ]);
  const ladGeo = new THREE.TubeGeometry(ladCurve, 12, 0.0009, 8, false);
  const ladMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.55,
    roughness: 0.18,
  });
  group.add(new THREE.Mesh(ladGeo, ladMat));

  return group;
}

/**
 * Zone 2 Organ (Lower Sternum / Subxiphoid Cut): Glossy Red-Maroon Hepatic Liver Lobes (Hepar)
 */
function createHepaticLiverOrgan(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hepatic_liver_organ';

  const liverMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    emissive: 0x3b0414,
    emissiveIntensity: 0.32,
    roughness: 0.20,
    metalness: 0.10,
  });

  // Left & Right Medial Hepatic Lobes visible through upper abdominal midline
  const rightLobeGeo = new THREE.SphereGeometry(0.011, 24, 24);
  rightLobeGeo.scale(0.85, 1.25, 0.72);
  const rightLobe = new THREE.Mesh(rightLobeGeo, liverMat);
  rightLobe.position.set(0.003, 0.002, 0);
  rightLobe.rotation.z = -0.15;
  group.add(rightLobe);

  const leftLobeGeo = new THREE.SphereGeometry(0.0095, 24, 24);
  leftLobeGeo.scale(0.82, 1.15, 0.68);
  const leftLobe = new THREE.Mesh(leftLobeGeo, liverMat);
  leftLobe.position.set(-0.004, 0.004, 0.001);
  leftLobe.rotation.z = 0.20;
  group.add(leftLobe);

  // Hepatic Vascular Branching Sinusoid
  const vesselCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.005, 0.009, 0.007),
    new THREE.Vector3(0.000, 0.000, 0.0085),
    new THREE.Vector3(-0.005, -0.008, 0.006),
  ]);
  const vesselGeo = new THREE.TubeGeometry(vesselCurve, 12, 0.0009, 8, false);
  const vesselMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.5,
    roughness: 0.18,
  });
  group.add(new THREE.Mesh(vesselGeo, vesselMat));

  return group;
}

/**
 * Zone 3 Organ (Epigastric Cut): Create anatomically accurate 3D Stomach (Gaster) model
 * situated in the epigastric region. Its local origin (0, 0, 0) is placed at its
 * anatomical central core so that scale operations naturally expand and bloom smoothly from the center.
 */
function createAnatomicalStomach(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'anatomical_stomach';
  group.userData = {
    id: 'human_stomach',
    name: 'Muscular J-Stomach (Gaster)',
    region: 'epigastrium',
  };

  // Visceral gastric serosa material (deep crimson base with warm anatomical tones and wet specular luster)
  const stomachMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    emissive: 0x450a0a,
    emissiveIntensity: 0.30,
    roughness: 0.24,
    metalness: 0.10,
  });

  // 1. Corpus (Main J-shaped central gastric reservoir centered at origin, proportioned to fit inside the parted incision window)
  const corpusGeo = new THREE.SphereGeometry(0.0125, 28, 28);
  corpusGeo.scale(0.88, 1.55, 0.72);
  const corpusMesh = new THREE.Mesh(corpusGeo, stomachMat);
  corpusMesh.position.set(0, 0, 0); // Origin at central core
  corpusMesh.rotation.z = -0.18;
  corpusMesh.castShadow = true;
  corpusMesh.receiveShadow = true;
  group.add(corpusMesh);

  // 2. Fundus (Superior rounded dome situated under left diaphragm inside incision window)
  const fundusGeo = new THREE.SphereGeometry(0.0095, 24, 24);
  fundusGeo.scale(1.05, 1.05, 0.78);
  const fundusMesh = new THREE.Mesh(fundusGeo, stomachMat);
  fundusMesh.position.set(-0.003, 0.013, 0.001);
  fundusMesh.castShadow = true;
  group.add(fundusMesh);

  // 3. Pyloric Antrum & Pylorus (Tapering muscular exit leading medially to duodenum)
  const pylorusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.002, -0.011, 0.002),
    new THREE.Vector3(0.004, -0.013, 0.003),
    new THREE.Vector3(0.009, -0.010, 0.001),
  ]);
  const pylorusGeo = new THREE.TubeGeometry(pylorusCurve, 16, 0.0045, 16, false);
  const pylorusMesh = new THREE.Mesh(pylorusGeo, stomachMat);
  pylorusMesh.castShadow = true;
  group.add(pylorusMesh);

  // 4. Greater Curvature Vascular Striation (Subtle gastric micro-ridges along greater curve)
  const rugaeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.002, 0.010, 0.008),
    new THREE.Vector3(-0.005, 0.001, 0.009),
    new THREE.Vector3(-0.003, -0.008, 0.007),
  ]);
  const rugaeGeo = new THREE.TubeGeometry(rugaeCurve, 16, 0.0008, 8, false);
  const rugaeMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.25,
    emissive: 0x9f1239,
    emissiveIntensity: 0.45,
  });
  const rugaeMesh = new THREE.Mesh(rugaeGeo, rugaeMat);
  group.add(rugaeMesh);

  // 5. Gastroepiploic Arterial Arcade (Branching vascular arcade along greater curvature)
  const vascularCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.005, 0.014, 0.003),
    new THREE.Vector3(-0.011, 0.004, 0.006),
    new THREE.Vector3(-0.010, -0.008, 0.007),
    new THREE.Vector3(-0.005, -0.015, 0.005),
    new THREE.Vector3(0.007, -0.011, 0.002),
  ]);
  const vascularGeo = new THREE.TubeGeometry(vascularCurve, 24, 0.0010, 8, false);
  const vascularMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.22,
    emissive: 0x991b1b,
    emissiveIntensity: 0.55,
  });
  const vascularMesh = new THREE.Mesh(vascularGeo, vascularMat);
  group.add(vascularMesh);

  return group;
}

/**
 * Zone 4 Organ (Umbilical / Hypogastric Cut): Coiled Red Vascular Small Intestine Loops (Intestinum tenue)
 */
function createIntestinalCoilsOrgan(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'intestinal_coils_organ';

  const serosaMat = new THREE.MeshStandardMaterial({
    color: 0xc81e1e,
    emissive: 0x450a0a,
    emissiveIntensity: 0.32,
    roughness: 0.24,
    metalness: 0.08,
  });

  const coilCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.005, 0.032, 0.001),
    new THREE.Vector3(0.006, 0.022, 0.004),
    new THREE.Vector3(-0.006, 0.011, 0.005),
    new THREE.Vector3(0.006, 0.000, 0.005),
    new THREE.Vector3(-0.005, -0.012, 0.004),
    new THREE.Vector3(0.005, -0.023, 0.003),
    new THREE.Vector3(-0.003, -0.033, 0.001),
  ]);
  const coilGeo = new THREE.TubeGeometry(coilCurve, 40, 0.0048, 14, false);
  const coilMesh = new THREE.Mesh(coilGeo, serosaMat);
  group.add(coilMesh);

  // Mesenteric Red Arterial Vasa Recta
  const mesenteryCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.000, 0.028, 0.0055),
    new THREE.Vector3(-0.002, 0.012, 0.0068),
    new THREE.Vector3(0.002, -0.005, 0.0068),
    new THREE.Vector3(-0.001, -0.022, 0.0052),
  ]);
  const mesenteryGeo = new THREE.TubeGeometry(mesenteryCurve, 24, 0.0011, 8, false);
  const mesenteryMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.55,
    roughness: 0.18,
  });
  group.add(new THREE.Mesh(mesenteryGeo, mesenteryMat));

  return group;
}

/**
 * Builds refined surgical incision geometry with:
 * 1. Fusiform / lenticular surgical retraction profile from chest middle down to active scalpel tip
 * 2. Smooth rounded superior entry apex fillet (no needle-like pointedness or wide shovel edge)
 * 3. Multi-layered vertex-colored dermal walls & recessed dark visceral cavity bed
 * 4. Time-progressive slow vascular crimson fluid seepage (segmentSpread) with soft UVs & gravity trickle
 */
function buildRefinedIncisionGeometries(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  segmentSpread?: Float32Array,
  segmentRetract?: Float32Array
): { furrowGeo: THREE.BufferGeometry; hemoGeo: THREE.BufferGeometry } {
  const furrowGeo = new THREE.BufferGeometry();
  const hemoGeo = new THREE.BufferGeometry();

  if (progress <= 0.01) {
    return { furrowGeo, hemoGeo };
  }

  const segmentCount = Math.max(16, Math.ceil(progress * 64));
  const normal = new THREE.Vector3(0, 0, 1);

  const furrowPositions: number[] = [];
  const furrowColors: number[] = [];
  const furrowIndices: number[] = [];

  const hemoPositions: number[] = [];
  const hemoUvs: number[] = [];
  const hemoIndices: number[] = [];

  const p0 = curve.getPointAt(0);
  const t0 = curve.getTangentAt(0).normalize();
  const lat0 = new THREE.Vector3().crossVectors(t0, normal).normalize();
  if (lat0.x < 0) lat0.negate();

  // Fix 3: Moderately wider upper aperture reference half-width (~26mm) shaped by fusiform retraction
  const wUpper = 0.026;
  const topRetractLevel = segmentRetract ? Math.max(0.25, segmentRetract[0]) : 1.0;
  const wEntryApex = wUpper * 0.22 * (0.45 + 0.55 * topRetractLevel);

  // Anatomical layer colors for vertex-shaded incision depth (deep pitch-black inner gap + dark crimson dermal rim)
  const colDermalLip = new THREE.Color(0x881337);     // incised vascular dermis lip
  const colSubdermalWall = new THREE.Color(0x060102); // steep near-black subcutaneous wall
  const colDeepCavity = new THREE.Color(0x010001);    // 0x1a0307 pitch-black shadowed coelomic cavity gap

  // 1. Smooth rounded superior apex fillet (Fix 3: removes needle-like point)
  const arcSteps = 12;
  const apexCenter = p0.clone().add(new THREE.Vector3(0, 0.002, 0.003));
  const apexCenterIdx = 0;
  furrowPositions.push(apexCenter.x, apexCenter.y, apexCenter.z);
  furrowColors.push(colDeepCavity.r, colDeepCavity.g, colDeepCavity.b);

  const arcVertexIndices: number[] = [];
  for (let s = 0; s <= arcSteps; s++) {
    const theta = Math.PI - (s / arcSteps) * Math.PI; // Arc from left to right
    const arcX = Math.cos(theta) * wEntryApex;
    const arcY = Math.sin(theta) * (wEntryApex * 0.85);
    const arcPt = p0.clone().add(lat0.clone().multiplyScalar(arcX)).add(new THREE.Vector3(0, arcY, 0.004));
    const idx = furrowPositions.length / 3;
    furrowPositions.push(arcPt.x, arcPt.y, arcPt.z);
    furrowColors.push(colDermalLip.r, colDermalLip.g, colDermalLip.b);
    arcVertexIndices.push(idx);

    if (s > 0) {
      furrowIndices.push(apexCenterIdx, arcVertexIndices[s - 1], idx);
    }
  }

  // 2. Traversed cut path down anterior sternal-abdominal midline
  // Each segment has 5 vertices across: [leftOuter, leftMid, deepCenter, rightMid, rightOuter]
  for (let i = 0; i <= segmentCount; i++) {
    const u = i / segmentCount;
    const absU = u * progress;
    const stationIdx = Math.min(64, Math.floor(absU * 64));

    // Time-driven tissue retraction and velocity-responsive vascular seepage at this station
    const rawRetract = segmentRetract ? segmentRetract[stationIdx] : 1.0;
    const retractEase = 0.28 + 0.72 * (rawRetract * rawRetract * (3 - 2 * rawRetract));

    const rawSpread = segmentSpread ? segmentSpread[stationIdx] : 1.0;
    const spreadEase = rawSpread * rawSpread * (3 - 2 * rawSpread);

    const pt = curve.getPointAt(absU);
    const tangent = curve.getTangentAt(absU).normalize();
    const lateral = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    if (lateral.x < 0) lateral.negate();

    // Smooth fusiform surgical retraction: widens from rounded superior entry apex into chest/epigastrium, then tapers to scalpel tip
    const topRetraction = 0.28 + 0.72 * Math.sin(Math.min(1, u / 0.20) * (Math.PI / 2));
    const baseHalfWidth = (0.0048 + (wUpper * 0.78 - 0.0048) * Math.pow(1 - u, 1.2)) * topRetraction * retractEase;
    // Smooth visceral window dilation around epigastric stomach region
    const stomachFactor = Math.sin(Math.PI * Math.min(1, Math.max(0, (absU - 0.08) / 0.75)));
    const visceralBulge = progress > 0.05 ? 0.0052 * stomachFactor * Math.sin(u * Math.PI) * retractEase : 0;
    const halfWidth = i === 0 ? wEntryApex : baseHalfWidth + visceralBulge;

    const midWidth = halfWidth * 0.66;
    const depth = 0.009 * (1 - u * 0.35); // deep recessed black cavity cleft along incision

    const leftOuter = pt.clone().sub(lateral.clone().multiplyScalar(halfWidth)).add(new THREE.Vector3(0, 0, 0.0045));
    const leftMid = pt.clone().sub(lateral.clone().multiplyScalar(midWidth)).add(new THREE.Vector3(0, 0, 0.0022));
    const deepCenter = pt.clone().sub(new THREE.Vector3(0, 0, depth * 0.35));
    const rightMid = pt.clone().add(lateral.clone().multiplyScalar(midWidth)).add(new THREE.Vector3(0, 0, 0.0022));
    const rightOuter = pt.clone().add(lateral.clone().multiplyScalar(halfWidth)).add(new THREE.Vector3(0, 0, 0.0045));

    const rowStart = furrowPositions.length / 3;
    furrowPositions.push(leftOuter.x, leftOuter.y, leftOuter.z);
    furrowPositions.push(leftMid.x, leftMid.y, leftMid.z);
    furrowPositions.push(deepCenter.x, deepCenter.y, deepCenter.z);
    furrowPositions.push(rightMid.x, rightMid.y, rightMid.z);
    furrowPositions.push(rightOuter.x, rightOuter.y, rightOuter.z);

    furrowColors.push(
      colDermalLip.r, colDermalLip.g, colDermalLip.b,
      colSubdermalWall.r, colSubdermalWall.g, colSubdermalWall.b,
      colDeepCavity.r, colDeepCavity.g, colDeepCavity.b,
      colSubdermalWall.r, colSubdermalWall.g, colSubdermalWall.b,
      colDermalLip.r, colDermalLip.g, colDermalLip.b
    );

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

    // Fix 2: Thick, wide, organic vascular crimson seepage along BOTH sides of the open black incision gap
    // Leaves the central black gap (-midWidth to +midWidth) open so the cut looks genuinely parted
    const organicLobes =
      1.08 +
      0.38 * Math.sin(absU * 34.0 + 0.7) +
      0.26 * Math.cos(absU * 71.0) +
      0.16 * Math.sin(absU * 119.0);
    const leftLobeVar = 0.92 + 0.28 * Math.sin(absU * 46.0 + 1.4);
    const rightLobeVar = 0.92 + 0.28 * Math.cos(absU * 57.0 + 0.5);

    const baseSeepWidth = 0.0085 + (0.036 * spreadEase) * (0.65 + 0.35 * Math.sin(u * Math.PI));
    const hemoWidthLeft = baseSeepWidth * organicLobes * leftLobeVar;
    const hemoWidthRight = baseSeepWidth * organicLobes * rightLobeVar;
    // Downward gravity trickle on outer spreading edge
    const gravityTrickleY = -0.012 * spreadEase * spreadEase * Math.max(0.25, Math.sin(absU * 48.0 + 1.1));

    const hLeftOuter = leftOuter
      .clone()
      .sub(lateral.clone().multiplyScalar(hemoWidthLeft))
      .add(new THREE.Vector3(0, gravityTrickleY, -0.0004));
    // Anchor inner blood edge along the parted dermal lip so the central black gap remains clearly open
    const hLeftInner = leftOuter.clone().add(lateral.clone().multiplyScalar(halfWidth * 0.24));
    const hRightInner = rightOuter.clone().sub(lateral.clone().multiplyScalar(halfWidth * 0.24));
    const hRightOuter = rightOuter
      .clone()
      .add(lateral.clone().multiplyScalar(hemoWidthRight))
      .add(new THREE.Vector3(0, gravityTrickleY, -0.0004));

    const hRow = hemoPositions.length / 3;
    hemoPositions.push(hLeftOuter.x, hLeftOuter.y, hLeftOuter.z + 0.0014);
    hemoPositions.push(hLeftInner.x, hLeftInner.y, hLeftInner.z + 0.0018);
    hemoPositions.push(hRightInner.x, hRightInner.y, hRightInner.z + 0.0018);
    hemoPositions.push(hRightOuter.x, hRightOuter.y, hRightOuter.z + 0.0014);

    // UVs for soft feathered alpha diffusion texture (u=0 at inner cut lip, u=1 at outer skin margin)
    hemoUvs.push(
      1.0, absU * 2.5,
      0.0, absU * 2.5,
      0.0, absU * 2.5,
      1.0, absU * 2.5
    );

    if (i > 0) {
      const prevH = hRow - 4;
      // Left wide vascular seepage band (flanking the open central black gap)
      hemoIndices.push(prevH, hRow, prevH + 1);
      hemoIndices.push(prevH + 1, hRow, hRow + 1);
      // Right wide vascular seepage band (flanking the open central black gap)
      hemoIndices.push(prevH + 2, hRow + 2, prevH + 3);
      hemoIndices.push(prevH + 3, hRow + 2, hRow + 3);
    }

    // Superior apex rim connection around top of cut
    if (i === 0) {
      const topBloodPt = p0.clone().add(new THREE.Vector3(0, wEntryApex * 1.55, 0.0058));
      const topBloodIdx = hemoPositions.length / 3;
      hemoPositions.push(topBloodPt.x, topBloodPt.y, topBloodPt.z);
      hemoUvs.push(0.25, 0.0);
      hemoIndices.push(hRow, hRow + 1, topBloodIdx);
      hemoIndices.push(topBloodIdx, hRow + 2, hRow + 3);
    }

    // Active cutting tip vascular cap: connect lips around leading apex of scalpel
    if (i === segmentCount) {
      const tipCapPt = pt.clone().add(tangent.clone().multiplyScalar(0.012)).add(new THREE.Vector3(0, 0, 0.0058));
      const tipCapIdx = hemoPositions.length / 3;
      hemoPositions.push(tipCapPt.x, tipCapPt.y, tipCapPt.z);
      hemoUvs.push(0.25, absU * 2.5);
      hemoIndices.push(hRow, tipCapIdx, hRow + 1);
      hemoIndices.push(hRow + 2, tipCapIdx, hRow + 3);
    }
  }

  furrowGeo.setAttribute('position', new THREE.Float32BufferAttribute(furrowPositions, 3));
  furrowGeo.setAttribute('color', new THREE.Float32BufferAttribute(furrowColors, 3));
  furrowGeo.setIndex(furrowIndices);
  furrowGeo.computeVertexNormals();

  hemoGeo.setAttribute('position', new THREE.Float32BufferAttribute(hemoPositions, 3));
  hemoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(hemoUvs, 2));
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
  const baseTubeRef = useRef<THREE.Mesh | null>(null);
  const startRingRef = useRef<THREE.Mesh | null>(null);
  const navelDotRef = useRef<THREE.Mesh | null>(null);
  const endRingRef = useRef<THREE.Mesh | null>(null);
  const cameraFollowCutRef = useRef<boolean>(false);
  const probeMeshRef = useRef<THREE.Group | null>(null);
  const progressTubeRef = useRef<THREE.Mesh | null>(null);
  const incisionHemoRef = useRef<THREE.Mesh | null>(null);
  const activeHemoHaloRef = useRef<THREE.Mesh | null>(null);
  const thoracicHeartRef = useRef<THREE.Group | null>(null);
  const hepaticLiverRef = useRef<THREE.Group | null>(null);
  const stomachGroupRef = useRef<THREE.Group | null>(null);
  const intestinalCoilsRef = useRef<THREE.Group | null>(null);
  const hemoBeadsRef = useRef<Array<{ mesh: THREE.Mesh; uPos: number; side: number; speed: number }>>([]);
  const segmentSpreadRef = useRef<Float32Array>(new Float32Array(65));
  const segmentRetractRef = useRef<Float32Array>(new Float32Array(65));
  const stationSpeedRef = useRef<Float32Array>(new Float32Array(65));
  const cutVelocityRef = useRef<number>(0.22);
  const lastCutTimestampRef = useRef<number>(0);
  const organEmergenceRef = useRef<Float32Array>(new Float32Array(4));
  const raycastHitPlaneRef = useRef<THREE.Mesh | null>(null);
  const skinMeshDataRef = useRef<Array<{
    posAttr: THREE.BufferAttribute;
    origPositions: Float32Array;
    center: THREE.Vector3;
  }>>([]);
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

  // Build the 3D Catmull-Rom Curve from Chest Middle (mid-sternum) down to Suprapubic boundary
  const buildGuideCurve = useCallback(
    (calib: GuideCalibration) => {
      const topY = 0.44 * calib.lengthScale + calib.yOffset;        // Chest middle (mid-sternum / pectoral midline)
      const upperChestY = 0.30 * calib.lengthScale + calib.yOffset; // Lower chest / xiphoid process
      const epigastricY = 0.16 * calib.lengthScale + calib.yOffset; // Epigastrium (upper abdomen)
      const midY = 0.02 * calib.lengthScale + calib.yOffset;        // Umbilicus (navel landmark)
      const lowerAbdY = -0.05 * calib.lengthScale + calib.yOffset;  // Lower umbilical / hypogastrium
      const botY = -0.12 * calib.lengthScale + calib.yOffset;       // Suprapubic boundary (inferior limit — not stretched downwards)
      const zOff = calib.zOffset;

      const points = [
        new THREE.Vector3(0, topY, 0.154 + zOff),          // Chest middle (superior margin at mid-sternum)
        new THREE.Vector3(0, upperChestY, 0.150 + zOff),   // Lower sternum / xiphoid process
        new THREE.Vector3(0, epigastricY, 0.148 + zOff),   // Epigastrium (upper abdomen)
        new THREE.Vector3(0, midY, 0.136 + zOff),          // Umbilicus (navel landmark)
        new THREE.Vector3(0, lowerAbdY, 0.116 + zOff),     // Lower umbilical / hypogastrium
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

  // Reset Camera View to frame the anterior front torso
  const handleResetCamera = () => {
    if (!controlsRef.current || !modelGroupRef.current || !cameraRef.current) return;
    cameraFollowCutRef.current = false;
    const box = new THREE.Box3().setFromObject(modelGroupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 2;
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.05;
    const frontTarget = new THREE.Vector3(0, 0.10, 0);

    modelGroupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 0.12, cameraZ);
    controlsRef.current.reset(cameraZ, 0, Math.PI / 2.02, frontTarget);
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

  // Unified Progress Update Handler (tracks cutting velocity so fast cuts spread blood faster and slow cuts spread slowly)
  const handleProgressUpdate = (newVal: number) => {
    const clamped = Math.max(0, Math.min(1, newVal));
    cameraFollowCutRef.current = true;

    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dtCut = lastCutTimestampRef.current > 0
      ? Math.max(0.008, Math.min(0.45, (nowMs - lastCutTimestampRef.current) * 0.001))
      : 0.05;
    const dProg = Math.abs(clamped - lastProgressRef.current);
    if (dProg > 0.0004) {
      const instVel = dProg / dtCut; // progress/sec: ~0.12 for slow cut, ~0.5 for medium, ~1.5-3.5 for fast cut
      cutVelocityRef.current = Math.max(0.08, Math.min(4.0, cutVelocityRef.current * 0.35 + instVel * 0.65));
      lastCutTimestampRef.current = nowMs;
    }

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

  // Helper to dynamically part/recess the anterior human skin mesh under the active incision so skin never clips through the cut
  const updateSkinIncisionRecess = useCallback(
    (currProgress: number, calib: GuideCalibration, state: DissectionState) => {
      if (!skinMeshDataRef.current.length) return;
      const topY = 0.44 * calib.lengthScale + calib.yOffset;
      const botY = -0.12 * calib.lengthScale + calib.yOffset;
      const cutBottomY = topY - (topY - botY) * currProgress;

      for (const { posAttr, origPositions, center } of skinMeshDataRef.current) {
        const arr = posAttr.array as Float32Array;
        const count = posAttr.count;

        if (currProgress <= 0.01 || state === 'IDLE') {
          arr.set(origPositions);
          posAttr.needsUpdate = true;
          continue;
        }

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const rx = origPositions[idx];
          const ry = origPositions[idx + 1];
          const rz = origPositions[idx + 2];

          // Sketchfab_model matrix maps: worldX = rx - cx, worldY = rz - cy, worldZ = -ry - cz
          const wx = rx - center.x;
          const wy = rz - center.y;
          const wz = -ry - center.z;

          if (wz > 0.04 && Math.abs(wx) < 0.046 && wy <= topY + 0.006 && wy >= cutBottomY - 0.006) {
            const xRatio = Math.min(1, Math.abs(wx) / 0.046);
            const distFromEnds = Math.min(
              Math.max(0, topY + 0.006 - wy),
              Math.max(0, wy - (cutBottomY - 0.006))
            );
            const yFeather = Math.min(1, distFromEnds / 0.018);
            const recess = 0.028 * Math.cos(xRatio * (Math.PI / 2)) * yFeather;
            arr[idx] = rx;
            arr[idx + 1] = ry + recess; // +ry moves vertex deeper inward (-worldZ)
            arr[idx + 2] = rz;
          } else {
            arr[idx] = rx;
            arr[idx + 1] = ry;
            arr[idx + 2] = rz;
          }
        }
        posAttr.needsUpdate = true;
      }
    },
    []
  );

  const calibrationRef = useRef<GuideCalibration>(calibration);
  calibrationRef.current = calibration;

  // Update 3D Visual elements based on progress and calibration
  useEffect(() => {
    if (!guideGroupRef.current) return;

    const curve = buildGuideCurve(calibration);

    // 0. Part/recess the underlying human skin mesh along the active incision path
    updateSkinIncisionRecess(progress, calibration, dissectionState);

    // 0b. Progressively hide the blue/cyan guide line and waypoint markers along the already-cut path
    if (baseTubeRef.current) {
      if (progress >= 0.98) {
        baseTubeRef.current.visible = false;
      } else {
        baseTubeRef.current.visible = true;
        const nextBaseGeo = new THREE.TubeGeometry(curve, 64, 0.0035, 8, false);
        const cutSegments = Math.min(64, Math.ceil(progress * 64));
        const indicesPerSegment = 8 * 6; // radialSegments (8) * 6 indices per quad
        nextBaseGeo.setDrawRange(
          cutSegments * indicesPerSegment,
          (64 - cutSegments) * indicesPerSegment
        );
        const prevBaseGeo = baseTubeRef.current.geometry;
        baseTubeRef.current.geometry = nextBaseGeo;
        if (prevBaseGeo) prevBaseGeo.dispose();
      }
    }
    if (startRingRef.current) {
      startRingRef.current.position.copy(curve.getPointAt(0));
      startRingRef.current.visible = progress <= 0.02;
    }
    if (navelDotRef.current) {
      navelDotRef.current.position.copy(curve.getPointAt(0.5));
      navelDotRef.current.visible = progress < 0.48;
    }
    if (endRingRef.current) {
      endRingRef.current.position.copy(curve.getPointAt(1));
      endRingRef.current.visible = progress < 0.96;
    }

    // 1. Update Probe Position in 3D
    if (probeMeshRef.current) {
      const probePoint = curve.getPointAt(progress);
      probeMeshRef.current.position.copy(probePoint);
      probeMeshRef.current.visible = dissectionState !== 'IDLE';
    }

    // 2. Update Refined Incision Furrow & Velocity-Responsive Vascular Red Feedback
    if (progressTubeRef.current && incisionHemoRef.current) {
      if (progress <= 0.01 || dissectionState === 'IDLE') {
        segmentSpreadRef.current.fill(0);
        segmentRetractRef.current.fill(0);
        stationSpeedRef.current.fill(0);
        cutVelocityRef.current = 0.22;
        organEmergenceRef.current.fill(0);
        progressTubeRef.current.visible = false;
        incisionHemoRef.current.visible = false;
        if (activeHemoHaloRef.current) {
          activeHemoHaloRef.current.visible = false;
        }
        hemoBeadsRef.current.forEach((b) => {
          b.mesh.visible = false;
        });
      } else {
        progressTubeRef.current.visible = true;
        incisionHemoRef.current.visible = true;

        // Seed newly cut stations with initial capillary contact & record cutting speed at each station
        const maxStation = Math.floor(progress * 64);
        const activeVel = Math.max(0.10, Math.min(3.5, cutVelocityRef.current));
        const initSpreadSeed = Math.min(0.32, 0.06 + activeVel * 0.08);
        const initRetractSeed = Math.min(0.38, 0.16 + activeVel * 0.08);
        for (let k = 0; k <= 64; k++) {
          if (k <= maxStation) {
            if (stationSpeedRef.current[k] <= 0.01) {
              stationSpeedRef.current[k] = activeVel;
            } else {
              stationSpeedRef.current[k] = Math.max(stationSpeedRef.current[k], activeVel * 0.85);
            }
            if (segmentRetractRef.current[k] < initRetractSeed) {
              segmentRetractRef.current[k] = initRetractSeed;
            }
            if (segmentSpreadRef.current[k] < initSpreadSeed) {
              segmentSpreadRef.current[k] = initSpreadSeed;
            }
          } else {
            segmentRetractRef.current[k] = 0;
            segmentSpreadRef.current[k] = 0;
            stationSpeedRef.current[k] = 0;
          }
        }

        const { furrowGeo, hemoGeo } = buildRefinedIncisionGeometries(
          curve,
          progress,
          segmentSpreadRef.current,
          segmentRetractRef.current
        );
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
          activeHemoHaloRef.current.position.copy(activeTipPt).add(new THREE.Vector3(0, 0, 0.0055));
          activeHemoHaloRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), activeTangent);
          activeHemoHaloRef.current.visible = dissectionState === 'INTERACTION_ACTIVE';
        }
      }
    }

    // 3. Visceral Red Organs Emergence (Thoracic Heart, Hepatic Liver, Muscular J-Stomach, Intestinal Coils)
    if (stomachGroupRef.current) {
      if (progress <= 0.02 || dissectionState === 'IDLE') {
        stomachGroupRef.current.visible = false;
        stomachGroupRef.current.scale.set(0.001, 0.001, 0.001);
        if (thoracicHeartRef.current) {
          thoracicHeartRef.current.visible = false;
          thoracicHeartRef.current.scale.set(0.001, 0.001, 0.001);
        }
        if (hepaticLiverRef.current) {
          hepaticLiverRef.current.visible = false;
          hepaticLiverRef.current.scale.set(0.001, 0.001, 0.001);
        }
        if (intestinalCoilsRef.current) {
          intestinalCoilsRef.current.visible = false;
          intestinalCoilsRef.current.scale.set(0.001, 0.001, 0.001);
        }
      } else {
        // Epigastric / stomach region spans progress ~0.04 to ~0.52 combined with slow time emergence
        const tStomach = Math.min(1, Math.max(0, (progress - 0.04) / 0.42)) * Math.max(0.22, organEmergenceRef.current[2]);
        const sEase = tStomach * tStomach * (3 - 2 * tStomach); // smoothstep curve
        // Blooms smoothly and radially outward from central origin inside the incision cavity
        const stomachScale = 0.15 + 0.85 * sEase;
        stomachGroupRef.current.visible = progress >= 0.22;
        stomachGroupRef.current.scale.set(stomachScale, stomachScale, stomachScale);
        stomachGroupRef.current.position.set(
          -0.002 + sEase * 0.001,
          0.16,
          0.128 + sEase * 0.024 // emerges visibly forward through opened incision aperture
        );
      }
    }
  }, [progress, calibration, dissectionState, buildGuideCurve, updateSkinIncisionRecess]);

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

    // Balanced Studio Lighting Rig to showcase rich medium-dark brown skin tone and anatomical muscle definition
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.68);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffbeb, 1.18);
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.48);
    fillLight.position.set(-4, -1, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
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

    // A. Base Guide Tube (Subtle cyan line that hides progressively as cut advances)
    const baseTubeGeo = new THREE.TubeGeometry(curve, 64, 0.0035, 8, false);
    const baseTubeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.1,
    });
    const baseTubeMesh = new THREE.Mesh(baseTubeGeo, baseTubeMat);
    guideGroup.add(baseTubeMesh);
    baseTubeRef.current = baseTubeMesh;

    // B1. Zone 1 Red Visceral Organ: Thoracic Heart (emerges slowly where upper/mid chest is cut)
    const thoracicHeartGroup = createThoracicHeartOrgan();
    thoracicHeartGroup.position.set(0.0, 0.34, 0.126);
    thoracicHeartGroup.scale.set(0.001, 0.001, 0.001);
    thoracicHeartGroup.visible = false;
    thoracicHeartGroup.renderOrder = 2;
    guideGroup.add(thoracicHeartGroup);
    thoracicHeartRef.current = thoracicHeartGroup;

    // B2. Zone 2 Red Visceral Organ: Hepatic Liver Lobes (emerges slowly where subxiphoid/upper epigastrium is cut)
    const hepaticLiverGroup = createHepaticLiverOrgan();
    hepaticLiverGroup.position.set(-0.003, 0.24, 0.126);
    hepaticLiverGroup.scale.set(0.001, 0.001, 0.001);
    hepaticLiverGroup.visible = false;
    hepaticLiverGroup.renderOrder = 2;
    guideGroup.add(hepaticLiverGroup);
    hepaticLiverRef.current = hepaticLiverGroup;

    // B3. Zone 3 Red Visceral Organ: Anatomical Stomach (Fix 1: Stomach Region Expansion from central core)
    const stomachGroup = createAnatomicalStomach();
    stomachGroup.position.set(-0.002, 0.15, 0.130);
    stomachGroup.scale.set(0.001, 0.001, 0.001);
    stomachGroup.visible = false;
    stomachGroup.renderOrder = 2;
    guideGroup.add(stomachGroup);
    stomachGroupRef.current = stomachGroup;

    // B4. Zone 4 Red Visceral Organ: Vascular Small Intestine Coils (emerges slowly where umbilical/lower abdomen is cut)
    const intestinalCoilsGroup = createIntestinalCoilsOrgan();
    intestinalCoilsGroup.position.set(0.0, 0.01, 0.116);
    intestinalCoilsGroup.scale.set(0.001, 0.001, 0.001);
    intestinalCoilsGroup.visible = false;
    intestinalCoilsGroup.renderOrder = 2;
    guideGroup.add(intestinalCoilsGroup);
    intestinalCoilsRef.current = intestinalCoilsGroup;

    // C. Refined Incision Furrow (Fix 3: deep pitch-black interior surgical gap & steep dermal walls)
    const progTubeGeo = new THREE.BufferGeometry();
    const progTubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // uses per-vertex colors (0x3d1308 fascia / 0x1a0307 deep pitch-black cavity gap)
      vertexColors: true,
      roughness: 0.96,
      metalness: 0.0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const progTubeMesh = new THREE.Mesh(progTubeGeo, progTubeMat);
    progTubeMesh.visible = false;
    progTubeMesh.renderOrder = 1;
    guideGroup.add(progTubeMesh);
    progressTubeRef.current = progTubeMesh;

    // D. Incision Vascular Red Seepage (Fix 2: feathered organic diffusion texture that spreads slowly over time)
    const vascularDiffusionTex = createVascularDiffusionTexture();
    const hemoGeo = new THREE.BufferGeometry();
    const hemoMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // rich vibrant arterial crimson (0x881337 venous base)
      map: vascularDiffusionTex,
      transparent: true,
      depthWrite: false,
      emissive: 0x991b1b,
      emissiveIntensity: 0.72,
      roughness: 0.10, // glossy wet fluid sheen
      metalness: 0.12,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const hemoMesh = new THREE.Mesh(hemoGeo, hemoMat);
    hemoMesh.visible = false;
    hemoMesh.renderOrder = 3;
    guideGroup.add(hemoMesh);
    incisionHemoRef.current = hemoMesh;

    // D2. Slow-Swelling Vascular Meniscus Beads / Droplets along the incised skin edge
    const beadGeo = new THREE.SphereGeometry(0.0068, 14, 12);
    beadGeo.scale(1.15, 1.55, 0.75);
    const beadMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.58,
      roughness: 0.08, // specular wet droplet highlight
      metalness: 0.14,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const beadsList: Array<{ mesh: THREE.Mesh; uPos: number; side: number; speed: number }> = [];
    for (let bIdx = 0; bIdx < 18; bIdx++) {
      const bMesh = new THREE.Mesh(beadGeo, beadMat);
      bMesh.visible = false;
      bMesh.renderOrder = 4;
      guideGroup.add(bMesh);
      beadsList.push({
        mesh: bMesh,
        uPos: 0.04 + (bIdx / 18) * 0.90,
        side: bIdx % 2 === 0 ? -1 : 1,
        speed: 0.65 + (bIdx % 5) * 0.14,
      });
    }
    hemoBeadsRef.current = beadsList;

    // E. Active Cutting Tip Capillary Halo (Fix 2: surface-conforming localized vascular feedback)
    const haloGeo = new THREE.RingGeometry(0.004, 0.018, 28);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0xdc2626,
      emissiveIntensity: 0.92,
      roughness: 0.18,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    haloMesh.renderOrder = 4;
    guideGroup.add(haloMesh);
    activeHemoHaloRef.current = haloMesh;

    // C. Waypoint Markers (Start ring, Navel ring, End ring)
    const startPt = curve.getPointAt(0);
    const midPt = curve.getPointAt(0.5);
    const endPt = curve.getPointAt(1);

    // Start Waypoint Marker (Chest Middle)
    const startRingGeo = new THREE.TorusGeometry(0.012, 0.002, 8, 24);
    const startRingMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
    });
    const startRing = new THREE.Mesh(startRingGeo, startRingMat);
    startRing.position.copy(startPt);
    guideGroup.add(startRing);
    startRingRef.current = startRing;

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
    navelDotRef.current = navelDot;

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
    endRingRef.current = endRing;

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

    // E. Raycasting Collision Proxy Plane (Covers chest middle Y=0.44 down to suprapubic Y=-0.12)
    const hitPlaneGeo = new THREE.PlaneGeometry(0.28, 0.72);
    const hitPlaneMat = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    const hitPlane = new THREE.Mesh(hitPlaneGeo, hitPlaneMat);
    hitPlane.position.set(0, 0.16, 0.145);
    guideGroup.add(hitPlane);
    raycastHitPlaneRef.current = hitPlane;

    // Load the 3D GLB Model
    const loader = new GLTFLoader();

    const processLoadedGltf = (gltf: any, sourceName: string) => {
      const loadedScene = gltf.scene || gltf.scenes[0];

      let triangleCount = 0;
      let meshCount = 0;

      // Center geometry bounding box first so we know exact model center
      const box = new THREE.Box3().setFromObject(loadedScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      skinMeshDataRef.current = [];

      loadedScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          if (child.geometry) {
            triangleCount += child.geometry.index
              ? child.geometry.index.count / 3
              : child.geometry.attributes.position.count / 3;

            const posAttr = child.geometry.attributes.position as THREE.BufferAttribute | undefined;
            if (posAttr && posAttr.array) {
              skinMeshDataRef.current.push({
                posAttr,
                origPositions: new Float32Array(posAttr.array as Float32Array),
                center: center.clone(),
              });
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              // Natural warm medium-dark brown skin tone ("somewhat more dark brown not so much")
              if (mat instanceof THREE.MeshStandardMaterial) {
                if (!mat.map) {
                  mat.color = new THREE.Color(0x965d37);
                  mat.roughness = 0.56;
                  mat.metalness = 0.04;
                }
              } else if (mat instanceof THREE.MeshPhongMaterial) {
                if (!mat.map) {
                  mat.color = new THREE.Color(0x965d37);
                }
              }
            });
          }
        }
      });

      setModelStats({ triangles: Math.round(triangleCount), meshes: meshCount });
      modelGroup.add(loadedScene);

      loadedScene.position.sub(center);
      modelGroup.rotation.set(0, 0, 0);

      // Automatically position and orient human GLB to face the front (theta = 0)
      const maxDim = Math.max(size.x, size.y, size.z) || 2;
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.05;
      const frontTarget = new THREE.Vector3(0, 0.10, 0);

      camera.position.set(0, 0.12, cameraZ);
      controls.target.copy(frontTarget);
      controls.reset(cameraZ, 0, Math.PI / 2.02, frontTarget);
      controls.saveInitialState(new THREE.Vector3(0, 0.12, cameraZ), frontTarget);

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

        // Check if pointer is within the sternal-abdominal midline tolerance (±0.075m)
        if (Math.abs(localHit.x) <= 0.075) {
          const topY = 0.44 * calibrationRef.current.lengthScale + calibrationRef.current.yOffset;
          const botY = -0.12 * calibrationRef.current.lengthScale + calibrationRef.current.yOffset;
          const span = topY - botY;
          const calculatedProgress = (topY - localHit.y) / span;

          if (isStarting) {
            // If starting near the top (<= 0.35) or near current progress, activate drag
            if (calculatedProgress <= Math.max(0.35, lastProgressRef.current + 0.2)) {
              isDraggingGuideRef.current = true;
              cameraFollowCutRef.current = true;
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

    // Animation Loop: handles slow vascular blood spreading, slow organ emergence, and camera tracking along cut
    let lastFrameTime = performance.now();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) * 0.001));
      lastFrameTime = now;

      const activeProg = lastProgressRef.current;
      const activeCurve = buildGuideCurve(calibrationRef.current);

      // Pause automatic camera tracking if the user manually orbits/pans the 3D scene outside of cutting
      if (controls.isPointerDown && !isDraggingGuideRef.current && !isDraggingVerticalSliderRef.current) {
        cameraFollowCutRef.current = false;
      }

      // Moderate camera zoom to starting point when dissection starts & smooth vertical tracking along the cut
      if (cameraFollowCutRef.current) {
        const baseRadius = controls.initialRadius || 2.35;
        const posX = positionGroupRef.current?.position.x ?? 0;
        const posY = positionGroupRef.current?.position.y ?? 0;

        if (activeProg > 0.002 || isDraggingGuideRef.current || isDraggingVerticalSliderRef.current) {
          // Moderate zoom (~66% of full-body distance: not too close, not too far)
          const dissectionZoomRadius = Math.max(1.32, baseRadius * 0.66);
          const cutU = Math.max(0, Math.min(1, activeProg));
          const cutPt = activeCurve.getPointAt(cutU);

          // Camera target starts at upper chest starting point and moves down smoothly with the cut
          const desiredTargetX = posX + cutPt.x;
          const desiredTargetY = posY + cutPt.y * 0.78;
          const desiredTargetZ = 0.04;

          const camLerp = Math.min(1.0, dt * 5.2);
          controls.target.x += (desiredTargetX - controls.target.x) * camLerp;
          controls.target.y += (desiredTargetY - controls.target.y) * camLerp;
          controls.target.z += (desiredTargetZ - controls.target.z) * camLerp;
          controls.targetRadius += (dissectionZoomRadius - controls.targetRadius) * camLerp;
          controls.targetTheta += (0 - controls.targetTheta) * camLerp;
          controls.targetPhi += (Math.PI / 2.02 - controls.targetPhi) * camLerp;
        } else {
          // Smoothly restore to initial full-body framing when reset to 0%
          const camLerp = Math.min(1.0, dt * 5.5);
          controls.target.lerp(controls.initialTarget, camLerp);
          controls.targetRadius += (baseRadius - controls.targetRadius) * camLerp;
          controls.targetTheta += (controls.initialTheta - controls.targetTheta) * camLerp;
          controls.targetPhi += (controls.initialPhi - controls.targetPhi) * camLerp;
          if (Math.abs(controls.radius - baseRadius) < 0.015 && controls.target.distanceTo(controls.initialTarget) < 0.015) {
            cameraFollowCutRef.current = false;
          }
        }
      }

      controls.update();

      // Gentle auto-rotation when not interacting and enabled
      if (autoRotate && !controls.isPointerDown && !isDraggingGuideRef.current && modelGroup) {
        modelGroup.rotation.y += 0.003;
      }

      // Pulse probe focal light when in GUIDE_READY or INTERACTION_ACTIVE
      if (probeMeshRef.current && dissectionStateRef.current !== 'IDLE') {
        const time = now * 0.004;
        tipLight.intensity = 0.5 + Math.sin(time) * 0.2;
      }

      // Decay instantaneous cutting velocity smoothly when scalpel pauses
      cutVelocityRef.current = Math.max(0.10, cutVelocityRef.current * Math.exp(-dt * 2.5));

      if (activeProg > 0.01 && dissectionStateRef.current !== 'IDLE') {
        const maxStation = Math.floor(activeProg * 64);
        let needsGeoRebuild = false;

        // 1. Advance dermal retraction & velocity-responsive vascular blood spread at every cut station
        // Fast cutting -> fast blood spreading; Slow cutting -> slow blood spreading
        for (let k = 0; k <= maxStation; k++) {
          const stationVel = Math.max(stationSpeedRef.current[k] || 0.16, cutVelocityRef.current * 0.85);
          if (segmentRetractRef.current[k] < 1.0) {
            const retractRate = 0.28 + stationVel * 0.65;
            segmentRetractRef.current[k] = Math.min(1.0, segmentRetractRef.current[k] + dt * retractRate);
            needsGeoRebuild = true;
          }
          if (segmentSpreadRef.current[k] < 1.0) {
            const stationWave = (0.12 + stationVel * 0.72) * (0.85 + 0.25 * Math.sin(k * 0.45));
            segmentSpreadRef.current[k] = Math.min(1.0, segmentSpreadRef.current[k] + dt * stationWave);
            needsGeoRebuild = true;
          }
        }

        if (needsGeoRebuild && progressTubeRef.current && incisionHemoRef.current) {
          const { furrowGeo, hemoGeo } = buildRefinedIncisionGeometries(
            activeCurve,
            activeProg,
            segmentSpreadRef.current,
            segmentRetractRef.current
          );
          const oldF = progressTubeRef.current.geometry;
          progressTubeRef.current.geometry = furrowGeo;
          if (oldF) oldF.dispose();

          const oldH = incisionHemoRef.current.geometry;
          incisionHemoRef.current.geometry = hemoGeo;
          if (oldH) oldH.dispose();
        }

        // 2. Animate slow-forming glossy crimson meniscus droplets along the wide incised blood margin
        const wUpper = 0.026;
        const wLower = 0.018;
        hemoBeadsRef.current.forEach((bead, bIdx) => {
          if (bead.uPos <= activeProg - 0.015) {
            const stIdx = Math.min(64, Math.floor(bead.uPos * 64));
            const localSpread = segmentSpreadRef.current[stIdx];
            const localRetract = segmentRetractRef.current[stIdx];
            if (localSpread > 0.08) {
              bead.mesh.visible = true;
              const pt = activeCurve.getPointAt(bead.uPos);
              const uNorm = bead.uPos;
              const baseHalfW = (wUpper * (1 - uNorm) + wLower * uNorm) * (0.45 + 0.55 * localRetract);
              const trickleY = Math.pow(localSpread, 1.5) * 0.012 * ((bIdx % 3) + 1) * 0.55;
              const lateralOut = baseHalfW + localSpread * (0.012 + (bIdx % 4) * 0.0055);
              bead.mesh.position.set(
                pt.x + bead.side * lateralOut,
                pt.y - trickleY,
                pt.z + 0.0038
              );
              const beadScale = Math.min(1.35, localSpread * 1.35) * (0.85 + 0.25 * Math.sin(now * 0.002 * bead.speed + bIdx));
              bead.mesh.scale.set(beadScale, beadScale * (1.1 + localSpread * 0.55), beadScale);
            } else {
              bead.mesh.visible = false;
            }
          } else {
            bead.mesh.visible = false;
          }
        });

        // 3. Slowly emerge red internal organs inside the parted black surgical gap
        // Zone 0: Thoracic Heart (emerges where upper/mid chest is cut: activeProg >= 0.04)
        if (thoracicHeartRef.current) {
          if (activeProg >= 0.04) {
            organEmergenceRef.current[0] = Math.min(1.0, organEmergenceRef.current[0] + dt * 0.38);
          } else {
            organEmergenceRef.current[0] = Math.max(0.0, organEmergenceRef.current[0] - dt * 1.2);
          }
          const e0 = organEmergenceRef.current[0];
          if (e0 > 0.01) {
            const ease0 = e0 * e0 * (3 - 2 * e0);
            const heartBeat = 1.0 + Math.sin(now * 0.0075) * 0.045 * ease0;
            const hScale = (0.12 + 0.64 * ease0) * heartBeat;
            const heartAnchor = activeCurve.getPointAt(0.11);
            thoracicHeartRef.current.visible = true;
            thoracicHeartRef.current.scale.set(hScale, hScale, hScale);
            thoracicHeartRef.current.position.set(
              heartAnchor.x + 0.001,
              heartAnchor.y,
              heartAnchor.z - 0.024 + ease0 * 0.022 // emerges inside the black chest incision cavity
            );
          } else {
            thoracicHeartRef.current.visible = false;
          }
        }

        // Zone 1: Hepatic Liver Lobes (emerges where subxiphoid / upper epigastrium is cut: activeProg >= 0.18)
        if (hepaticLiverRef.current) {
          if (activeProg >= 0.18) {
            organEmergenceRef.current[1] = Math.min(1.0, organEmergenceRef.current[1] + dt * 0.35);
          } else {
            organEmergenceRef.current[1] = Math.max(0.0, organEmergenceRef.current[1] - dt * 1.2);
          }
          const e1 = organEmergenceRef.current[1];
          if (e1 > 0.01) {
            const ease1 = e1 * e1 * (3 - 2 * e1);
            const resp = 1.0 + Math.sin(now * 0.0025) * 0.02 * ease1;
            const lScale = (0.12 + 0.64 * ease1) * resp;
            const liverAnchor = activeCurve.getPointAt(0.26);
            hepaticLiverRef.current.visible = true;
            hepaticLiverRef.current.scale.set(lScale, lScale, lScale);
            hepaticLiverRef.current.position.set(
              liverAnchor.x - 0.002 * ease1,
              liverAnchor.y,
              liverAnchor.z - 0.023 + ease1 * 0.021 // emerges inside the black subxiphoid cavity
            );
          } else {
            hepaticLiverRef.current.visible = false;
          }
        }

        // Zone 2: Muscular Red J-Stomach (emerges where mid-epigastrium is cut: activeProg >= 0.28)
        if (stomachGroupRef.current) {
          if (activeProg >= 0.24) {
            organEmergenceRef.current[2] = Math.min(1.0, organEmergenceRef.current[2] + dt * 0.34);
          } else {
            organEmergenceRef.current[2] = Math.max(0.0, organEmergenceRef.current[2] - dt * 1.2);
          }
          const e2 = organEmergenceRef.current[2];
          if (e2 > 0.01) {
            const ease2 = e2 * e2 * (3 - 2 * e2);
            const peristalsis = 1.0 + Math.sin(now * 0.003 + 1.2) * 0.025 * ease2;
            const sScale = (0.12 + 0.66 * ease2) * peristalsis;
            const stomachAnchor = activeCurve.getPointAt(0.46);
            stomachGroupRef.current.visible = true;
            stomachGroupRef.current.scale.set(sScale, sScale, sScale);
            stomachGroupRef.current.position.set(
              stomachAnchor.x + 0.001 * ease2,
              stomachAnchor.y,
              stomachAnchor.z - 0.022 + ease2 * 0.022 // emerges inside the black mid-abdominal cavity
            );
          } else {
            stomachGroupRef.current.visible = false;
          }
        }

        // Zone 3: Vascular Red Intestinal Coils (emerges where umbilical / lower abdomen is cut: activeProg >= 0.54)
        if (intestinalCoilsRef.current) {
          if (activeProg >= 0.54) {
            organEmergenceRef.current[3] = Math.min(1.0, organEmergenceRef.current[3] + dt * 0.33);
          } else {
            organEmergenceRef.current[3] = Math.max(0.0, organEmergenceRef.current[3] - dt * 1.2);
          }
          const e3 = organEmergenceRef.current[3];
          if (e3 > 0.01) {
            const ease3 = e3 * e3 * (3 - 2 * e3);
            const wave = 1.0 + Math.sin(now * 0.0035 + 2.4) * 0.025 * ease3;
            const iScale = (0.12 + 0.64 * ease3) * wave;
            const gutAnchor = activeCurve.getPointAt(0.74);
            intestinalCoilsRef.current.visible = true;
            intestinalCoilsRef.current.scale.set(iScale, iScale, iScale);
            intestinalCoilsRef.current.position.set(
              gutAnchor.x,
              gutAnchor.y,
              gutAnchor.z - 0.022 + ease3 * 0.022 // emerges inside the black lower-abdominal cavity
            );
          } else {
            intestinalCoilsRef.current.visible = false;
          }
        }
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
      beadGeo.dispose();
      beadMat.dispose();
      if (vascularDiffusionTex) vascularDiffusionTex.dispose();
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

  // Keep dissectionState ref updated for event handlers (Virtual Dissection is always active)
  const dissectionStateRef = useRef<DissectionState>(dissectionState);
  dissectionStateRef.current = dissectionState === 'IDLE' ? 'GUIDE_READY' : dissectionState;

  // Vertical Touch Slider Ref & Pointer/Touch Handler for smooth touchscreen scrubbing
  const verticalSliderTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingVerticalSliderRef = useRef<boolean>(false);

  const updateProgressFromVerticalTrack = (clientY: number) => {
    const track = verticalSliderTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.height <= 0) return;
    // Top of vertical slider = 0% (Epigastrium start), Bottom = 100% (Suprapubic end)
    const ratio = (clientY - rect.top) / rect.height;
    handleProgressUpdate( Math.max(0, Math.min(1, ratio)) );
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 w-full">
      <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[660px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
        {/* 3D Canvas Mount (midline incision along linea alba is always active) */}
        <div
          ref={mountRef}
          className="w-full h-full flex-1 cursor-crosshair"
        />

        {/* TOP-RIGHT ACTION CONTROLS (Unmarked utility controls preserved) */}
        <div className="absolute top-3 right-3 z-10 flex items-center justify-end pointer-events-none gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
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
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
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

        {/* VERTICAL TOUCH-SCREEN DISSECTION SLIDER DOCK ON THE SIDE OF THE VIEWER SCREEN */}
        <div
          data-testid="vertical-dissection-dock"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-auto flex flex-col items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-2.5 py-3.5 shadow-2xl"
        >
          {/* Percentage Readout */}
          <span className="font-mono font-bold text-[11px] text-cyan-400">
            {Math.round(progress * 100)}%
          </span>

          {/* Vertical Tactile Scrubber Track for Touch Screen & Mouse */}
          <div
            ref={verticalSliderTrackRef}
            data-testid="vertical-dissection-slider"
            role="slider"
            aria-label="Vertical Dissection Scrubber"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              isDraggingVerticalSliderRef.current = true;
              updateProgressFromVerticalTrack(e.clientY);
            }}
            onPointerMove={(e) => {
              if (!isDraggingVerticalSliderRef.current) return;
              e.stopPropagation();
              updateProgressFromVerticalTrack(e.clientY);
            }}
            onPointerUp={(e) => {
              if (!isDraggingVerticalSliderRef.current) return;
              e.stopPropagation();
              isDraggingVerticalSliderRef.current = false;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
            }}
            onPointerCancel={() => {
              isDraggingVerticalSliderRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                handleProgressUpdate(progress + 0.05);
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                handleProgressUpdate(progress - 0.05);
              }
            }}
            className="relative w-7 h-52 sm:h-60 flex items-center justify-center cursor-pointer touch-none select-none py-1"
            title="Slide vertically to perform abdominal midline dissection (0% to 100%)"
          >
            {/* Background Track Bar */}
            <div className="w-2.5 h-full bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 relative">
              {/* Filled Progress from Top (0% Epigastrium) to Bottom (100% Suprapubic) */}
              <div
                className="w-full bg-gradient-to-b from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-75"
                style={{ height: `${progress * 100}%` }}
              />
              {/* Landmark Ticks (Start / Mid / End) */}
              <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-40">
                <span className="w-full h-0.5 bg-white/40" />
                <span className="w-full h-0.5 bg-white/40" />
                <span className="w-full h-0.5 bg-white/40" />
              </div>
            </div>

            {/* Touch Thumb Handle */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/40 pointer-events-none transition-transform"
              style={{ top: `calc(${progress * 100}% - 10px)` }}
            />
          </div>

          {/* Step +25% Button */}
          <button
            onClick={handleAdvanceStep}
            disabled={progress >= 1.0}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 font-bold text-[10px] transition-colors cursor-pointer border border-slate-700"
            title="+25% Incision Step"
          >
            +25%
          </button>

          {/* Reset Dissection Button */}
          <button
            onClick={onResetDissection}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Reset Dissection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
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
  // Master Single Active Viewer State — Virtual Dissection is always ON ('GUIDE_READY') by default
  const [activeView, setActiveView] = useState<'external' | 'internal'>('external');
  const [dissectionState, setDissectionState] = useState<DissectionState>('GUIDE_READY');
  const [progress, setProgress] = useState<number>(0.0);
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

  // Return to External Body View (keeps Virtual Dissection active)
  const handleReturnToExternal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView('external');
      setDissectionState('GUIDE_READY');
      setIsTransitioning(false);
    }, 350);
  };

  // Full Reset Demonstration Handler (keeps Virtual Dissection always active)
  const handleResetDemonstration = () => {
    setProgress(0.0);
    setDissectionState('GUIDE_READY');
    setActiveView('external');
  };

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
      </div>
    </HumanViewerErrorBoundary>
  );
};
