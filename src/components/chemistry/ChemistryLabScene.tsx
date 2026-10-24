import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { DraggableObjectManager } from '../../simulations/draggableObjectManager';
import { ChemicalReagent, ReactionDefinition } from '../../types/chemistry';
import { REAGENTS } from '../../data/reactionsData';
import { findOrLookupCompound, getCanonicalRegistry } from '../../data/compoundRegistry';
import { Global3DViewer } from '../common/Global3DViewer';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';
import { soundEngine } from '../../utils/soundEngine';
import {
  FlaskConical,
  Droplet,
  Sparkles,
  Thermometer,
  RotateCcw,
  Eye,
  Layers,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Zap,
  Info,
} from 'lucide-react';

interface ChemistryLabSceneProps {
  temperature: number;
  concentration: number;
  catalyst: boolean;
  onUpdateConditions: (conds: { temperature?: number; concentration?: number; catalyst?: boolean }) => void;
  activeReaction: ReactionDefinition | null;
  reagentsInBeaker: Record<string, number>; // reagentId -> quantity in mL or g
  inventory: Record<string, number>; // reagentId -> remaining quantity
  onPourReagent: (reagentId: string, amount: number) => void;
  onResetBeaker: () => void;
  onTryIt?: () => void;
  hideReagentShelf?: boolean;
}

// Universal canvas rounded rectangle helper compatible with all browsers and Android webviews
function drawSafeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof (ctx as any).roundRect === 'function') {
    try {
      (ctx as any).roundRect(x, y, w, h, r);
      return;
    } catch (e) {}
  }
  // Standard fallback using basic canvas path commands
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Generate Pyrex laboratory beaker graduation texture with high-contrast markings
function createBeakerGraduationTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    try {
      ctx.clearRect(0, 0, 1024, 1024);

      // Frosted white enamel label box with dark border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      drawSafeRoundedRect(ctx, 120, 310, 360, 155, 14);
      ctx.fill();
      ctx.stroke();

      // Pyrex / Tech-Anatomix branding text
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TECH-ANATOMIX PYREX®', 300, 365);
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('BORO 3.3 · 250 mL', 300, 405);
      ctx.font = '600 19px "JetBrains Mono", monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText('ISO 3819 · ±5% ACCURACY', 300, 435);

      // Graduation Scale lines (from 50 mL to 250 mL)
      const marks = [
        { ml: '250', y: 220, major: true },
        { ml: '', y: 270, major: false },
        { ml: '200', y: 320, major: true },
        { ml: '', y: 370, major: false },
        { ml: '150', y: 420, major: true },
        { ml: '', y: 470, major: false },
        { ml: '100', y: 520, major: true },
        { ml: '', y: 570, major: false },
        { ml: '50', y: 620, major: true },
      ];

      marks.forEach((m) => {
        const lineY = m.y + 120;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = m.major ? 8 : 5;
        ctx.beginPath();
        ctx.moveTo(555, lineY);
        ctx.lineTo(m.major ? 690 : 640, lineY);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = m.major ? 6 : 3.5;
        ctx.beginPath();
        ctx.moveTo(555, lineY);
        ctx.lineTo(m.major ? 690 : 640, lineY);
        ctx.stroke();

        if (m.ml) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.beginPath();
          drawSafeRoundedRect(ctx, 420, lineY - 18, 120, 36, 8);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 26px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${m.ml} ml`, 480, lineY + 9);
        }
      });

      // Vertical graduation spine line
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(690, 220 + 120);
      ctx.lineTo(690, 620 + 120);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(690, 220 + 120);
      ctx.lineTo(690, 620 + 120);
      ctx.stroke();
    } catch (e) {
      console.warn('Graduation canvas drawing error handled:', e);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Deep recursive disposal helper to prevent memory leaks
function disposeObject(obj: THREE.Object3D) {
  if (!obj) return;
  obj.traverse((child: any) => {
    if (child.geometry) {
      try {
        child.geometry.dispose();
      } catch (e) {}
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: any) => {
          if (mat.map) {
            try { mat.map.dispose(); } catch (e) {}
          }
          try { mat.dispose(); } catch (e) {}
        });
      } else {
        if (child.material.map) {
          try { child.material.map.dispose(); } catch (e) {}
        }
        try { child.material.dispose(); } catch (e) {}
      }
    }
  });
}

function resolveChemicalReagent(id: string): ChemicalReagent {
  const fromCanon = getCanonicalRegistry().find((c) => c.id === id);
  if (fromCanon) return fromCanon;
  const fromLookup = findOrLookupCompound(id).compound;
  if (fromLookup) return fromLookup;
  const fromShelf = REAGENTS.find((r) => r.id === id);
  if (fromShelf) return fromShelf;
  return {
    id,
    name: id,
    formula: id,
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    appearanceDescription: 'Clear, colourless aqueous solution',
    type: 'reagent',
    category: 'salt',
    initialQuantity: 100,
    pourAmount: 20,
    unit: 'mL',
    description: 'Chemical reagent',
    isSimulationSupported: false,
  };
}

function isReagentColorless(reagent: Partial<ChemicalReagent>): boolean {
  if (reagent.isColorless) return true;
  if (!reagent.color) return true;
  const hex = reagent.color.trim().toUpperCase();
  return hex === '#F8FAFC' || hex === '#FFFFFF' || hex === '#F1F5F9';
}

export const ChemistryLabScene: React.FC<ChemistryLabSceneProps> = ({
  temperature,
  concentration,
  catalyst,
  onUpdateConditions,
  activeReaction,
  reagentsInBeaker,
  inventory,
  onPourReagent,
  onResetBeaker,
  onTryIt,
  hideReagentShelf = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const dragManagerRef = useRef<DraggableObjectManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pourStreamRef = useRef<THREE.Mesh | null>(null);
  const reactionStartTimeRef = useRef<number>(0);
  const lastReactionIdRef = useRef<string | null>(null);
  const solidScaleRef = useRef<number>(1.0);

  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [molecularView, setMolecularView] = useState(false);
  const [pouringReagentName, setPouringReagentName] = useState<string | null>(null);
  const [isPouringAnim, setIsPouringAnim] = useState(false);
  const [hoveredReagent, setHoveredReagent] = useState<ChemicalReagent | null>(null);
  const [isOverBeaker, setIsOverBeaker] = useState(false);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageOverride, setStageOverride] = useState<'auto' | 'initial' | 'final'>('auto');
  const [uiReactionProgress, setUiReactionProgress] = useState<number>(0);
  const labApparatusGroupRef = useRef<THREE.Group | null>(null);
  const stageOverrideRef = useRef<'auto' | 'initial' | 'final'>('auto');

  useEffect(() => {
    stageOverrideRef.current = stageOverride;
  }, [stageOverride]);

  // Reset stage override to 'auto' whenever the active reaction changes
  useEffect(() => {
    setStageOverride('auto');
    if (!activeReaction) {
      setUiReactionProgress(0);
    }
  }, [activeReaction?.id]);

  useEffect(() => {
    if (labApparatusGroupRef.current) {
      labApparatusGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  // Beaker center position in 3D
  const beakerCenter = useMemo(() => new THREE.Vector3(0, 0, 0.4), []);

  // Total fluid volume in beaker (mL)
  const totalVolume = useMemo(() => {
    return Object.values(reagentsInBeaker).reduce((sum, v) => sum + (v || 0), 0);
  }, [reagentsInBeaker]);

  // List of active reagents for HUD with complete resolved chemical metadata
  const activeReagentsList = useMemo(() => {
    return Object.entries(reagentsInBeaker)
      .filter(([_, amount]) => amount > 0)
      .map(([id, amount]) => {
        const def = resolveChemicalReagent(id);
        return { id, amount, def };
      });
  }, [reagentsInBeaker]);

  // Synchronize state-driven laboratory audio (effervescence, boiling >= 100°C, violent burst, or silence)
  useEffect(() => {
    const hasLiquid =
      activeReagentsList.some((item) => item.def.state === 'liquid') ||
      (totalVolume > 0 && Boolean(activeReaction));
    soundEngine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid,
      totalVolume,
      temperatureC: temperature,
      reactionProgress: uiReactionProgress,
      activeReaction,
      reactionRunKey: activeReaction ? `${activeReaction.id}::${reactionStartTimeRef.current}` : undefined,
    });
  }, [activeReagentsList, totalVolume, temperature, uiReactionProgress, activeReaction]);

  useEffect(() => {
    return () => {
      soundEngine.stopSource('chemistry-lab');
    };
  }, []);

  // Keep a persistent ref of latest props so the animation loop always has current state WITHOUT rebuilding WebGL!
  const stateRef = useRef({
    temperature,
    concentration,
    catalyst,
    activeReaction,
    reagentsInBeaker,
    inventory,
    totalVolume,
    molecularView,
    showGrid,
    onPourReagent,
  });

  useEffect(() => {
    stateRef.current = {
      temperature,
      concentration,
      catalyst,
      activeReaction,
      reagentsInBeaker,
      inventory,
      totalVolume,
      molecularView,
      showGrid,
      onPourReagent,
    };
  }, [temperature, concentration, catalyst, activeReaction, reagentsInBeaker, inventory, totalVolume, molecularView, showGrid, onPourReagent]);

  const handleReplayReaction = () => {
    setStageOverride('auto');
    reactionStartTimeRef.current = performance.now();
    solidScaleRef.current = 1.0;
    setUiReactionProgress(0);
  };

  // INITIALIZE THREE.JS SCENE ONCE ON MOUNT
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 3.2,
      maxDistance: 16,
      maxPolarAngle: Math.PI / 2 - 0.05,
    });
    controls.target.set(0, 1.05, 0.4);
    controlsRef.current = controls;

    // -------------------------------------------------------------------------
    // LIGHTING SETUP
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-6, 5, -4);
    scene.add(fillLight);

    const reactionPointLight = new THREE.PointLight(0xff4500, 0, 14, 1.2);
    reactionPointLight.position.set(beakerCenter.x, beakerCenter.y + 1.2, beakerCenter.z);
    scene.add(reactionPointLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -0.35, {
      includeStagePlatform: false,
      fogDensity: 0.014,
    });

    // -------------------------------------------------------------------------
    // UNIVERSAL LAB APPARATUS GROUP (FOR POSITION CONTROLLERS)
    // -------------------------------------------------------------------------
    const labApparatusGroup = new THREE.Group();
    labApparatusGroup.position.set(modelPosition.x, modelPosition.y, 0);
    labApparatusGroupRef.current = labApparatusGroup;
    scene.add(labApparatusGroup);

    // -------------------------------------------------------------------------
    // TABLE & SHELF
    // -------------------------------------------------------------------------
    const tableGeo = new THREE.BoxGeometry(11.0, 0.35, 8.0);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x15373d, roughness: 0.38, metalness: 0.25 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.175;
    table.receiveShadow = true;
    labApparatusGroup.add(table);

    const matGeo = new THREE.BoxGeometry(3.8, 0.025, 3.8);
    const matMat = new THREE.MeshStandardMaterial({ color: 0x1e4650, roughness: 0.28, metalness: 0.16 });
    const spillMat = new THREE.Mesh(matGeo, matMat);
    spillMat.position.set(beakerCenter.x, 0.012, beakerCenter.z);
    spillMat.receiveShadow = true;
    labApparatusGroup.add(spillMat);

    const grid = new THREE.GridHelper(9.0, 18, 0x38bdf8, 0x1e4e58);
    grid.position.y = 0.026;
    styleStudioGridHelper(grid);
    labApparatusGroup.add(grid);

    const shelfGeo = new THREE.BoxGeometry(8.2, 0.14, 1.6);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x244c56, roughness: 0.32, metalness: 0.35 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 0.55, -2.2);
    shelf.receiveShadow = true;
    shelf.castShadow = true;
    labApparatusGroup.add(shelf);

    // -------------------------------------------------------------------------
    // MAIN PYREX GLASS BEAKER
    // -------------------------------------------------------------------------
    const beakerGroup = new THREE.Group();
    beakerGroup.position.copy(beakerCenter);

    const beakerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.35,
      opacity: 0.9,
      transparent: true,
      roughness: 0.04,
      metalness: 0.06,
      reflectivity: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      ior: 1.54,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const glassRimMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.75,
    });

    const outerBeakerGeo = new THREE.CylinderGeometry(0.94, 0.92, 1.9, 48, 1, true);
    const outerBeaker = new THREE.Mesh(outerBeakerGeo, beakerGlassMat);
    outerBeaker.position.y = 0.95;
    outerBeaker.castShadow = true;
    outerBeaker.receiveShadow = true;
    beakerGroup.add(outerBeaker);

    const bottomRimGeo = new THREE.TorusGeometry(0.92, 0.02, 12, 48);
    const bottomRim = new THREE.Mesh(bottomRimGeo, glassRimMat);
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.y = 0.04;
    beakerGroup.add(bottomRim);

    const bottomGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.09, 48);
    const bottomMesh = new THREE.Mesh(bottomGeo, beakerGlassMat);
    bottomMesh.position.y = 0.045;
    bottomMesh.receiveShadow = true;
    beakerGroup.add(bottomMesh);

    const rimGeo = new THREE.TorusGeometry(0.93, 0.042, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, beakerGlassMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.9;
    beakerGroup.add(rimMesh);

    const spoutGeo = new THREE.ConeGeometry(0.2, 0.3, 16, 1, true, 0, Math.PI);
    const spoutMesh = new THREE.Mesh(spoutGeo, beakerGlassMat);
    spoutMesh.rotation.x = Math.PI / 2.2;
    spoutMesh.position.set(0, 1.92, 0.93);
    beakerGroup.add(spoutMesh);

    const gradTexture = createBeakerGraduationTexture();
    const gradGeo = new THREE.CylinderGeometry(0.944, 0.924, 1.9, 48, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    const gradMat = new THREE.MeshBasicMaterial({
      map: gradTexture,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const gradMesh = new THREE.Mesh(gradGeo, gradMat);
    gradMesh.position.y = 0.95;
    beakerGroup.add(gradMesh);

    // -------------------------------------------------------------------------
    // LIQUID MESHES (SCIENTIFICALLY ACCURATE COLOURLESS vs COLOURED OPTICS)
    // -------------------------------------------------------------------------
    const liquidGroup = new THREE.Group();
    const liquidGeo = new THREE.CylinderGeometry(0.88, 0.86, 1.0, 36);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8f4fc,
      transmission: 0.72,
      roughness: 0.05,
      metalness: 0.02,
      clearcoat: 1.0,
      opacity: 0.30,
      transparent: true,
      ior: 1.333,
      depthWrite: false,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 0.5;
    liquidMesh.receiveShadow = true;
    liquidGroup.add(liquidMesh);

    const meniscusGeo = new THREE.CircleGeometry(0.88, 36);
    const meniscusMat = new THREE.MeshStandardMaterial({
      color: 0xe8f4fc,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.38,
    });
    const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat);
    meniscusMesh.rotation.x = -Math.PI / 2;
    meniscusMesh.position.y = 1.0;
    liquidGroup.add(meniscusMesh);

    // Subtle specular meniscus rim ring so clear colourless water/solutions are always visibly bounded against glass
    const meniscusRimGeo = new THREE.TorusGeometry(0.875, 0.012, 12, 48);
    const meniscusRimMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.65,
    });
    const meniscusRimMesh = new THREE.Mesh(meniscusRimGeo, meniscusRimMat);
    meniscusRimMesh.rotation.x = Math.PI / 2;
    meniscusRimMesh.position.y = 1.0;
    liquidGroup.add(meniscusRimMesh);

    // Surface foam/froth ring ONLY for vigorous foaming reactions (e.g. Elephant Toothpaste, Bicarbonate fizz)
    const foamGeo = new THREE.CylinderGeometry(0.87, 0.87, 0.11, 32);
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      transparent: true,
      opacity: 0.78,
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.position.y = 1.05;
    foamMesh.visible = false;
    liquidGroup.add(foamMesh);

    beakerGroup.add(liquidGroup);

    // -------------------------------------------------------------------------
    // SOLIDS: Potassium, Magnesium, Zinc, Copper, Iron, and Generic Solids
    // -------------------------------------------------------------------------
    const kGeo = new THREE.DodecahedronGeometry(0.14);
    const kMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
    const kMesh = new THREE.Mesh(kGeo, kMat);
    kMesh.position.set(0.12, 0.5, 0.06);
    kMesh.visible = false;
    beakerGroup.add(kMesh);

    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 0.1, -0.2),
      new THREE.Vector3(-0.1, 0.38, 0.2),
      new THREE.Vector3(0.3, 0.22, -0.1),
      new THREE.Vector3(0.5, 0.09, 0.3),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 32, 0.045, 8, false);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.visible = false;
    beakerGroup.add(ribbonMesh);

    // Zinc granules cluster
    const zincGroup = new THREE.Group();
    const znMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.82, roughness: 0.32 });
    const znGeo = new THREE.DodecahedronGeometry(0.048);
    for (let i = 0; i < 14; i++) {
      const zMesh = new THREE.Mesh(znGeo, znMat);
      const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.2;
      const rad = 0.15 + (i % 4) * 0.12;
      zMesh.position.set(Math.cos(angle) * rad, 0.075 + (i % 2) * 0.02, Math.sin(angle) * rad);
      zMesh.rotation.set((i * 0.5) % Math.PI, (i * 0.7) % Math.PI, (i * 0.3) % Math.PI);
      zincGroup.add(zMesh);
    }
    zincGroup.visible = false;
    beakerGroup.add(zincGroup);

    // Copper turnings / coils (characteristic reddish-brown metallic lustre #B87333)
    const copperGroup = new THREE.Group();
    const cuMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.88, roughness: 0.22 });
    const cuGeo = new THREE.TorusGeometry(0.055, 0.017, 8, 16);
    for (let i = 0; i < 8; i++) {
      const cuMesh = new THREE.Mesh(cuGeo, cuMat);
      const angle = (i / 8) * Math.PI * 2;
      const rad = 0.22 + (i % 3) * 0.1;
      cuMesh.position.set(Math.cos(angle) * rad, 0.08, Math.sin(angle) * rad);
      cuMesh.rotation.set((i * 0.8) % Math.PI, (i * 1.1) % Math.PI, (i * 0.4) % Math.PI);
      copperGroup.add(cuMesh);
    }
    copperGroup.visible = false;
    beakerGroup.add(copperGroup);

    // Iron filings / shavings
    const ironGroup = new THREE.Group();
    const feMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.78, roughness: 0.45 });
    const feGeo = new THREE.DodecahedronGeometry(0.032);
    for (let i = 0; i < 18; i++) {
      const feMesh = new THREE.Mesh(feGeo, feMat);
      const angle = (i / 18) * Math.PI * 2;
      const rad = 0.12 + (i % 5) * 0.08;
      feMesh.position.set(Math.cos(angle) * rad, 0.07, Math.sin(angle) * rad);
      feMesh.rotation.set(i * 0.4, i * 0.6, i * 0.2);
      ironGroup.add(feMesh);
    }
    ironGroup.visible = false;
    beakerGroup.add(ironGroup);

    // Generic Solid Reactants Group (for CaCO3 marble chips, NaHCO3 powder, MnO2 black catalyst, etc.)
    const genericSolidGroup = new THREE.Group();
    const genericSolidMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75, metalness: 0.1 });
    const genericSolidGeo = new THREE.DodecahedronGeometry(0.044);
    for (let i = 0; i < 16; i++) {
      const sMesh = new THREE.Mesh(genericSolidGeo, genericSolidMat);
      const angle = (i / 16) * Math.PI * 2 + (i % 2) * 0.25;
      const rad = 0.1 + (i % 4) * 0.11;
      sMesh.position.set(Math.cos(angle) * rad, 0.07 + (i % 3) * 0.015, Math.sin(angle) * rad);
      sMesh.rotation.set(i * 0.5, i * 0.8, i * 0.3);
      genericSolidGroup.add(sMesh);
    }
    genericSolidGroup.visible = false;
    beakerGroup.add(genericSolidGroup);

    // -------------------------------------------------------------------------
    // PRECIPITATE DYNAMICS: Distinct Solid Phase (Particle Swarm + Textured Sediment Bed)
    // -------------------------------------------------------------------------
    const precipitateGroup = new THREE.Group();
    beakerGroup.add(precipitateGroup);

    // Growing solid sediment bed at beaker bottom
    const pGeo = new THREE.CylinderGeometry(0.84, 0.83, 0.15, 36);
    const pMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.05 });
    const precipitateMesh = new THREE.Mesh(pGeo, pMat);
    precipitateMesh.position.y = 0.08;
    precipitateMesh.visible = false;
    precipitateGroup.add(precipitateMesh);

    // Textured solid mounds on top of sediment bed so precipitate looks unmistakably like a separate solid phase
    const sedimentMoundsGroup = new THREE.Group();
    const moundGeo = new THREE.SphereGeometry(0.11, 12, 10);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(moundGeo, pMat);
      const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.3;
      const rad = (i % 4) * 0.19;
      m.position.set(Math.cos(angle) * rad, 0, Math.sin(angle) * rad);
      m.scale.set(1.2, 0.35 + (i % 3) * 0.12, 1.2);
      sedimentMoundsGroup.add(m);
    }
    sedimentMoundsGroup.visible = false;
    precipitateGroup.add(sedimentMoundsGroup);

    // Colloidal turbidity cloud inside liquid (forms initially, then clarifies as solid precipitate settles to the bottom)
    const cloudGeo = new THREE.CylinderGeometry(0.83, 0.82, 1.0, 24);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      roughness: 1.0,
      depthWrite: false,
    });
    const turbidityCloud = new THREE.Mesh(cloudGeo, cloudMat);
    turbidityCloud.visible = false;
    precipitateGroup.add(turbidityCloud);

    // 90 micro-precipitate solid crystal/flocculant particles settling to bottom
    const particlePool: {
      mesh: THREE.Mesh;
      initialX: number;
      initialYFrac: number;
      initialZ: number;
      settleSpeed: number;
      currentY: number;
      phase: number;
      settled: boolean;
    }[] = [];

    const partGeoDodeca = new THREE.DodecahedronGeometry(0.036);
    const partGeoOcta = new THREE.OctahedronGeometry(0.04);
    const partMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.08 });

    for (let i = 0; i < 90; i++) {
      const geo = i % 2 === 0 ? partGeoDodeca : partGeoOcta;
      const partMesh = new THREE.Mesh(geo, partMat);
      partMesh.visible = false;
      precipitateGroup.add(partMesh);

      const r = Math.random() * 0.74;
      const angle = Math.random() * Math.PI * 2;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      particlePool.push({
        mesh: partMesh,
        initialX: px,
        initialYFrac: 0.15 + Math.random() * 0.8,
        initialZ: pz,
        settleSpeed: 0.14 + Math.random() * 0.2,
        currentY: 0.5,
        phase: Math.random() * Math.PI * 2,
        settled: false,
      });
    }

    const stirBarGeo = new THREE.CapsuleGeometry(0.055, 0.44, 8, 16);
    const stirBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
    const stirBar = new THREE.Mesh(stirBarGeo, stirBarMat);
    stirBar.rotation.z = Math.PI / 2;
    stirBar.position.set(0, 0.075, 0);
    beakerGroup.add(stirBar);

    // -------------------------------------------------------------------------
    // THERMOMETER & STIRRING ROD
    // -------------------------------------------------------------------------
    const thermGroup = new THREE.Group();
    thermGroup.position.set(0.68, 0.06, 0.15);
    thermGroup.rotation.z = -0.14;

    const stemGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.0, 16);
    const stemMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, transparent: true, roughness: 0.06 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1.0;
    thermGroup.add(stem);

    const mercGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.0, 16);
    const mercMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const merc = new THREE.Mesh(mercGeo, mercMat);
    merc.position.y = 0.5;
    thermGroup.add(merc);
    beakerGroup.add(thermGroup);

    const rodGeo = new THREE.CylinderGeometry(0.038, 0.038, 2.2, 16);
    const rodMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, transparent: true, roughness: 0.05 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(-0.45, 1.1, -0.3);
    rod.rotation.z = 0.22;
    rod.rotation.x = -0.15;
    beakerGroup.add(rod);

    // -------------------------------------------------------------------------
    // EXPLOSION & VIOLENT REACTION OBJECTS (FIXED POOL)
    // -------------------------------------------------------------------------
    const explosionGroup = new THREE.Group();

    const fireballGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const fireballMat = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xff5722,
      emissiveIntensity: 4.5,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
    });
    const fireballMesh = new THREE.Mesh(fireballGeo, fireballMat);
    fireballMesh.visible = false;
    explosionGroup.add(fireballMesh);

    const coronaGeo = new THREE.SphereGeometry(0.65, 20, 20);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.6 });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    coronaMesh.visible = false;
    explosionGroup.add(coronaMesh);

    const shockwaveGeo1 = new THREE.RingGeometry(0.8, 1.6, 28);
    const shockwaveMat1 = new THREE.MeshBasicMaterial({ color: 0xff5722, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const shockwaveMesh1 = new THREE.Mesh(shockwaveGeo1, shockwaveMat1);
    shockwaveMesh1.rotation.x = Math.PI / 2;
    shockwaveMesh1.visible = false;
    explosionGroup.add(shockwaveMesh1);

    const shockwaveGeo2 = new THREE.RingGeometry(0.6, 1.2, 28);
    const shockwaveMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const shockwaveMesh2 = new THREE.Mesh(shockwaveGeo2, shockwaveMat2);
    shockwaveMesh2.rotation.x = Math.PI / 2;
    shockwaveMesh2.visible = false;
    explosionGroup.add(shockwaveMesh2);

    const sparkGeo = new THREE.DodecahedronGeometry(0.04);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const sparksPool: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < 60; i++) {
      const sp = new THREE.Mesh(sparkGeo, sparkMat);
      sp.visible = false;
      explosionGroup.add(sp);

      const angle = Math.random() * Math.PI * 2;
      const speedH = 1.0 + Math.random() * 2.8;
      sparksPool.push({
        mesh: sp,
        vx: Math.cos(angle) * speedH,
        vy: 2.5 + Math.random() * 4.2,
        vz: Math.sin(angle) * speedH,
        life: Math.random() * 0.8,
        maxLife: 0.8 + Math.random() * 0.8,
      });
    }
    beakerGroup.add(explosionGroup);

    // -------------------------------------------------------------------------
    // AIRBORNE FUME / COLOURED GAS PLUME POOL (ONLY FOR GENUINE AIRBORNE FUMES)
    // Never activated for ordinary liquid-phase effervescence!
    // -------------------------------------------------------------------------
    const gasGroup = new THREE.Group();
    const vaporGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const vaporMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const vaporPool: { mesh: THREE.Mesh; seedX: number; seedZ: number; speed: number; phase: number; scaleRate: number }[] = [];

    for (let i = 0; i < 32; i++) {
      const v = new THREE.Mesh(vaporGeo, vaporMat);
      v.visible = false;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.58;
      const sx = Math.cos(angle) * r;
      const sz = Math.sin(angle) * r;
      gasGroup.add(v);

      vaporPool.push({
        mesh: v,
        seedX: sx,
        seedZ: sz,
        speed: 1.1 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        scaleRate: 1.0 + Math.random() * 1.2,
      });
    }
    beakerGroup.add(gasGroup);

    // -------------------------------------------------------------------------
    // LIQUID-PHASE EFFERVESCENCE BUBBLES & SURFACE MENISCUS BURST RINGS
    // Nucleate at reaction site / submerged solid surface, rise through liquid,
    // and burst at the liquid surface!
    // -------------------------------------------------------------------------
    const bubblesGroup = new THREE.Group();
    const bubbleGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 0.78,
      transparent: true,
      roughness: 0.04,
      metalness: 0.08,
      clearcoat: 1.0,
      ior: 1.0,
    });

    const bubblesPool: {
      mesh: THREE.Mesh;
      solidSiteX: number;
      solidSiteZ: number;
      bulkX: number;
      bulkZ: number;
      speed: number;
      baseScale: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < 90; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      b.visible = false;
      const angle = (i / 90) * Math.PI * 2 + (i % 7) * 0.35;
      // Solid nucleation sites clustered around submerged solid radius (0.08 to 0.44)
      const solidR = 0.06 + (i % 8) * 0.048;
      // Bulk liquid nucleation sites across beaker radius (0.08 to 0.74)
      const bulkR = 0.08 + ((i * 17) % 70) * 0.0095;
      const baseScale = 0.55 + (i % 5) * 0.16;
      b.scale.set(baseScale, baseScale, baseScale);
      b.position.y = 0.08 + (i / 90) * 0.8;
      bubblesGroup.add(b);

      bubblesPool.push({
        mesh: b,
        solidSiteX: Math.cos(angle) * solidR,
        solidSiteZ: Math.sin(angle) * solidR,
        bulkX: Math.cos(angle) * bulkR,
        bulkZ: Math.sin(angle) * bulkR,
        speed: 0.45 + (i % 9) * 0.11,
        baseScale,
        phase: i * 0.45,
      });
    }

    // Surface meniscus burst ripples where rising effervescence bubbles pop at the liquid surface
    const surfaceRipplesPool: { mesh: THREE.Mesh; x: number; z: number; progress: number; speed: number }[] = [];
    const rippleGeo = new THREE.RingGeometry(0.014, 0.036, 16);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 24; i++) {
      const rMesh = new THREE.Mesh(rippleGeo, rippleMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.visible = false;
      const angle = (i / 24) * Math.PI * 2 + (i % 3) * 0.4;
      const rad = 0.08 + (i % 6) * 0.11;
      bubblesGroup.add(rMesh);
      surfaceRipplesPool.push({
        mesh: rMesh,
        x: Math.cos(angle) * rad,
        z: Math.sin(angle) * rad,
        progress: (i / 24),
        speed: 1.2 + (i % 5) * 0.35,
      });
    }

    beakerGroup.add(bubblesGroup);

    // Pour stream
    const streamGeo = new THREE.CylinderGeometry(0.045, 0.07, 1.2, 16);
    const streamMat = new THREE.MeshPhysicalMaterial({ color: 0xe8f4fc, transmission: 0.7, transparent: true, opacity: 0.55, roughness: 0.1 });
    const pourStream = new THREE.Mesh(streamGeo, streamMat);
    pourStream.visible = false;
    labApparatusGroup.add(pourStream);
    pourStreamRef.current = pourStream;

    labApparatusGroup.add(beakerGroup);

    // -------------------------------------------------------------------------
    // DRAGGABLE REAGENT BOTTLES ON SHELF
    // -------------------------------------------------------------------------
    const dragManager = new DraggableObjectManager(camera, renderer.domElement, controls, {
      dragPlaneNormal: new THREE.Vector3(0, 1, 0),
      dragPlaneConstant: -0.55,
      onHover: (item) => {
        if (item) {
          const reagent = REAGENTS.find((r) => r.id === item.id);
          setHoveredReagent(reagent || null);
        } else {
          setHoveredReagent(null);
        }
      },
      onDragStart: (item) => {
        const reagent = REAGENTS.find((r) => r.id === item.id);
        if (reagent) setHoveredReagent(reagent);
      },
      onDragMove: (item, currentPos) => {
        const distToBeaker = new THREE.Vector2(currentPos.x - beakerCenter.x, currentPos.z - beakerCenter.z).length();
        setIsOverBeaker(distToBeaker < 1.5);
      },
      onDragEnd: (item, finalPos) => {
        const distToBeaker = new THREE.Vector2(finalPos.x - beakerCenter.x, finalPos.z - beakerCenter.z).length();

        if (distToBeaker < 1.6) {
          const reagent = REAGENTS.find((r) => r.id === item.id);
          const currentInventory = stateRef.current.inventory;
          if (reagent && (currentInventory[reagent.id] ?? reagent.initialQuantity) > 0) {
            triggerPourAnimation(item.mesh as THREE.Group, reagent, item.originalPosition);
          } else {
            item.mesh.position.copy(item.originalPosition);
          }
        } else {
          item.mesh.position.copy(item.originalPosition);
        }
        setIsOverBeaker(false);
      },
    });
    dragManagerRef.current = dragManager;

    // Create 3D Bottle Meshes on Shelf with accurate chemical colours and colourless transparency
    const bottleFills: { id: string; fillMesh: THREE.Mesh; initialQty: number }[] = [];
    const bottleCount = REAGENTS.length;
    const spacing = 7.2 / (bottleCount - 1);

    REAGENTS.forEach((r, idx) => {
      const bottleGroup = new THREE.Group();
      const xPos = -3.6 + idx * spacing;
      bottleGroup.position.set(xPos, 0.62, -2.2);

      const bottleBodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.68, 20);
      const bottleBodyMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, transparent: true, roughness: 0.08, ior: 1.5 });
      const bottleMesh = new THREE.Mesh(bottleBodyGeo, bottleBodyMat);
      bottleMesh.position.y = 0.34;
      bottleMesh.castShadow = true;
      bottleGroup.add(bottleMesh);

      const colorless = isReagentColorless(r);
      const fillGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16);
      const fillMat =
        r.state === 'liquid'
          ? new THREE.MeshPhysicalMaterial({
              color: colorless ? new THREE.Color(0xe8f4fc) : new THREE.Color(r.color),
              transparent: true,
              opacity: colorless ? 0.32 : 0.84,
              transmission: colorless ? 0.68 : 0.25,
              roughness: 0.08,
              metalness: 0.04,
            })
          : new THREE.MeshStandardMaterial({
              color: new THREE.Color(r.color),
              roughness: 0.25,
              metalness: r.type === 'metal' || r.type === 'alkali_metal' ? 0.85 : 0.15,
            });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      fillMesh.position.y = 0.225 + 0.04;
      bottleGroup.add(fillMesh);
      bottleFills.push({ id: r.id, fillMesh, initialQty: r.initialQuantity });

      const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: r.hazard ? 0xb91c1c : 0x1e293b, roughness: 0.4 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 0.74;
      bottleGroup.add(capMesh);

      labApparatusGroup.add(bottleGroup);
      dragManager.registerItem(r.id, bottleGroup);
    });

    // Pouring Animation Function
    function triggerPourAnimation(bottleMesh: THREE.Group, reagent: ChemicalReagent, originalPos: THREE.Vector3) {
      setIsPouringAnim(true);
      setPouringReagentName(reagent.name);

      bottleMesh.position.set(beakerCenter.x + 0.65, 1.85, beakerCenter.z);
      bottleMesh.rotation.z = -Math.PI / 3.2;

      if (pourStreamRef.current) {
        const sMat = pourStreamRef.current.material as THREE.MeshPhysicalMaterial;
        const colorless = isReagentColorless(reagent);
        sMat.color.set(colorless ? 0xe8f4fc : reagent.color);
        sMat.opacity = colorless ? 0.36 : 0.82;
        pourStreamRef.current.position.set(beakerCenter.x + 0.42, 1.25, beakerCenter.z);
        pourStreamRef.current.visible = true;
      }

      setTimeout(() => {
        stateRef.current.onPourReagent(reagent.id, reagent.pourAmount);

        if (pourStreamRef.current) {
          pourStreamRef.current.visible = false;
        }

        bottleMesh.rotation.z = 0;
        bottleMesh.position.copy(originalPos);

        setIsPouringAnim(false);
        setPouringReagentName(null);
      }, 700);
    }

    // -------------------------------------------------------------------------
    // CONTINUOUS 60 FPS ANIMATION LOOP (SCIENTIFICALLY ACCURATE VISUALS)
    // -------------------------------------------------------------------------
    let lastTime = performance.now();
    let lastUiUpdate = 0;

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const rawDelta = (currentTime - lastTime) / 1000;
      const delta = Number.isFinite(rawDelta) && rawDelta > 0 ? Math.min(rawDelta, 0.05) : 0.016;
      lastTime = currentTime;

      controls.update();

      const {
        temperature: curTemp,
        concentration: curConc,
        catalyst: curCat,
        activeReaction: curReaction,
        reagentsInBeaker: curReagents,
        inventory: curInv,
        totalVolume: curVol,
        showGrid: curGrid,
      } = stateRef.current;

      grid.visible = curGrid;

      // -----------------------------------------------------------------------
      // REACTION TIMELINE & PROGRESS (INITIAL -> DURING -> FINAL)
      // -----------------------------------------------------------------------
      if (curReaction?.id !== lastReactionIdRef.current) {
        lastReactionIdRef.current = curReaction?.id || null;
        reactionStartTimeRef.current = currentTime;
        solidScaleRef.current = 1.0;
        const initFluidHeight = curVol > 0 ? Math.min(0.25 + (curVol / 100) * 1.05, 1.6) : 0.4;
        particlePool.forEach((p) => {
          p.currentY = Math.max(0.12, initFluidHeight * p.initialYFrac);
          p.settled = false;
        });
      }

      const elapsedSec = curReaction ? (currentTime - (reactionStartTimeRef.current || currentTime)) / 1000 : 0;
      const overrideMode = stageOverrideRef.current;

      // Reaction progresses over 6.0 seconds from 0.0 (initial reactants) to 1.0 (final products)
      let reactionProgress = 0;
      if (curReaction) {
        if (overrideMode === 'initial') {
          reactionProgress = 0;
        } else if (overrideMode === 'final') {
          reactionProgress = 1.0;
        } else {
          reactionProgress = Math.min(1.0, Math.max(0.0, elapsedSec / 6.0));
        }
      }

      if (currentTime - lastUiUpdate > 120) {
        lastUiUpdate = currentTime;
        setUiReactionProgress(reactionProgress);
      }

      // -----------------------------------------------------------------------
      // COMPUTE INITIAL vs FINAL LIQUID APPEARANCE (COLOURLESS vs COLOURED)
      // -----------------------------------------------------------------------
      const addedKeys = Object.keys(curReagents).filter((k) => curReagents[k] > 0);
      const presentDefs = addedKeys.map((id) => ({
        id,
        amount: curReagents[id],
        def: resolveChemicalReagent(id),
      }));

      const liquidDefs = presentDefs.filter((item) => item.def.state === 'liquid');
      const solidDefs = presentDefs.filter((item) => item.def.state === 'solid');

      // Determine if liquid is present (either liquid reagents added, or totalVolume > 0 with aqueous context)
      const hasLiquid = liquidDefs.length > 0 || (curVol > 0 && Boolean(curReaction));
      const fluidHeight = hasLiquid ? Math.min(0.25 + (curVol / 100) * 1.05, 1.6) : 0.02;

      // Compute Initial Liquid Colour from actual added liquid reagents
      // Important: Colourless liquids remain crystal-clear colourless; if mixed with a coloured reagent (like blue CuSO4),
      // the coloured species determines the initial chromatic hue before reaction!
      const coloredLiquids = liquidDefs.filter((item) => !isReagentColorless(item.def));
      const initialIsColorless = coloredLiquids.length === 0;
      const initialColor = new THREE.Color(0xe8f4fc);

      if (!initialIsColorless) {
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let totalW = 0;
        coloredLiquids.forEach((item) => {
          const c = new THREE.Color(item.def.color);
          rSum += c.r * item.amount;
          gSum += c.g * item.amount;
          bSum += c.b * item.amount;
          totalW += item.amount;
        });
        if (totalW > 0) {
          initialColor.setRGB(rSum / totalW, gSum / totalW, bSum / totalW);
        }
      }

      // Compute Final Liquid Colour after reaction
      let finalIsColorless = initialIsColorless;
      const finalColor = initialColor.clone();

      if (curReaction && curReaction.observableEffects) {
        const eff = curReaction.observableEffects;
        const rawColor = (eff.colorChangeTo || '').trim();
        finalIsColorless =
          Boolean(eff.isFinalSolutionColorless) ||
          rawColor.toUpperCase() === '#F8FAFC' ||
          rawColor.toUpperCase() === '#FFFFFF';

        if (finalIsColorless) {
          finalColor.setHex(0xe8f4fc);
        } else if (rawColor.startsWith('#')) {
          try {
            finalColor.set(rawColor);
          } catch (e) {
            finalColor.copy(initialColor);
          }
        }
      }

      liquidGroup.visible = hasLiquid;
      if (hasLiquid) {
        liquidMesh.scale.set(1, Math.max(0.01, fluidHeight), 1);
        liquidMesh.position.y = fluidHeight / 2 + 0.06;
        meniscusMesh.position.y = fluidHeight + 0.06;
        meniscusRimMesh.position.y = fluidHeight + 0.06;

        // Interpolate optical colour, opacity, and transmission from Initial State (progress=0) to Final State (progress=1)
        const initOpacity = initialIsColorless ? 0.26 : 0.80;
        const initTransmission = initialIsColorless ? 0.76 : 0.28;

        const targetOpacity = curReaction
          ? finalIsColorless
            ? 0.26
            : 0.82
          : initOpacity;
        const targetTransmission = curReaction
          ? finalIsColorless
            ? 0.76
            : 0.26
          : initTransmission;

        const blendedColor = initialColor.clone().lerp(finalColor, reactionProgress);
        const blendedOpacity = THREE.MathUtils.lerp(initOpacity, targetOpacity, reactionProgress);
        const blendedTransmission = THREE.MathUtils.lerp(initTransmission, targetTransmission, reactionProgress);

        liquidMat.color.copy(blendedColor);
        liquidMat.opacity = blendedOpacity;
        liquidMat.transmission = blendedTransmission;

        meniscusMat.color.copy(blendedColor);
        meniscusMat.opacity = Math.min(0.9, blendedOpacity + 0.08);

        // Surface foam ring ONLY for genuine foaming reactions (never a solid white block on ordinary gas reactions)
        const isFoamingReaction =
          curReaction &&
          reactionProgress > 0.05 &&
          (curReaction.observableEffects?.hazardType === 'foaming_fountain' ||
            curReaction.id === 'elephant_toothpaste' ||
            curReaction.id === 'ki_peroxide_catalysis' ||
            curReaction.id === 'vinegar_baking_soda' ||
            curReaction.id === 'citric_bicarbonate' ||
            curReaction.id === 'citric_bicarbonate_fizz' ||
            curReaction.id === 'hcl_nahco3_gas');

        foamMesh.visible = Boolean(isFoamingReaction);
        if (isFoamingReaction) {
          const foamScaleY = 0.4 + Math.min(1.0, reactionProgress * 1.4) * 0.8 + Math.sin(currentTime * 0.006) * 0.08;
          foamMesh.scale.set(1, foamScaleY, 1);
          foamMesh.position.y = fluidHeight + 0.07;
        }
      }

      // -----------------------------------------------------------------------
      // 1. SOLIDS IN BEAKER: Dissolution & Single-Displacement Surface Coating
      // -----------------------------------------------------------------------
      const hasCoating = Boolean(curReaction?.observableEffects?.solidCoatingColor);
      const isDissolvingReaction = Boolean(
        curReaction &&
          !hasCoating &&
          (curReaction.reactionType === 'gas_evolution' ||
            curReaction.observableEffects?.producesGas ||
            curReaction.observableEffects?.isViolent)
      );

      if (isDissolvingReaction && hasLiquid) {
        // Dissolve down to 0.18 scale as reaction completes so user sees solid shrinking during effervescence
        solidScaleRef.current = THREE.MathUtils.lerp(1.0, 0.18, reactionProgress);
      } else {
        solidScaleRef.current = 1.0;
      }

      const sScale = solidScaleRef.current;

      // Apply single-displacement metallic surface coating (e.g. reddish-brown Cu on Fe/Zn, or silver Ag crystals on Cu)
      const baseZnColor = new THREE.Color(0x94a3b8);
      const baseCuColor = new THREE.Color(0xb87333);
      const baseFeColor = new THREE.Color(0x475569);

      if (hasCoating && curReaction?.observableEffects?.solidCoatingColor) {
        const coatColor = new THREE.Color(curReaction.observableEffects.solidCoatingColor);
        znMat.color.copy(baseZnColor).lerp(coatColor, reactionProgress);
        cuMat.color.copy(baseCuColor).lerp(coatColor, reactionProgress);
        feMat.color.copy(baseFeColor).lerp(coatColor, reactionProgress);
      } else {
        znMat.color.copy(baseZnColor);
        cuMat.color.copy(baseCuColor);
        feMat.color.copy(baseFeColor);
      }

      ribbonMesh.scale.set(sScale, sScale, sScale);
      ribbonMesh.visible = (curReagents['mg'] || 0) > 0 && sScale > 0.05;

      kMesh.scale.set(sScale, sScale, sScale);
      kMesh.visible = (curReagents['k_metal'] || 0) > 0 && sScale > 0.05;

      zincGroup.scale.set(sScale, sScale, sScale);
      zincGroup.visible = (curReagents['zn'] || 0) > 0 && sScale > 0.05;

      copperGroup.scale.set(isDissolvingReaction ? sScale : 1, isDissolvingReaction ? sScale : 1, isDissolvingReaction ? sScale : 1);
      copperGroup.visible = (curReagents['cu'] || 0) > 0;

      ironGroup.scale.set(sScale, sScale, sScale);
      ironGroup.visible = (curReagents['fe'] || 0) > 0 && sScale > 0.05;

      // Generic solids (CaCO3 marble chips, NaHCO3 powder, MnO2 catalyst, etc.)
      const otherSolids = solidDefs.filter(
        (s) => !['mg', 'k_metal', 'zn', 'cu', 'fe'].includes(s.id)
      );
      if (otherSolids.length > 0) {
        genericSolidGroup.visible = true;
        genericSolidMat.color.set(otherSolids[0].def.color || '#F8FAFC');
        // Catalyst (mno2) does not get consumed; carbonate/bicarbonate solids dissolve during reaction
        const isCatalystOnly = otherSolids.every((s) => s.def.type === 'catalyst' || s.id === 'mno2');
        const genScale = isCatalystOnly ? 1.0 : sScale;
        genericSolidGroup.scale.set(genScale, genScale, genScale);
      } else {
        genericSolidGroup.visible = false;
      }

      // -----------------------------------------------------------------------
      // 2. PRECIPITATE FORMATION: Separate Solid Phase Nucleating & Settling
      // -----------------------------------------------------------------------
      const hasPrecipitate = Boolean(curReaction?.observableEffects?.producesPrecipitate);
      if (hasPrecipitate && hasLiquid && reactionProgress > 0.02) {
        let pColorHex = 0xffffff;
        if (curReaction?.observableEffects?.precipitateColor) {
          try {
            const raw = curReaction.observableEffects.precipitateColor;
            if (raw.startsWith('#')) {
              const parsed = parseInt(raw.replace('#', ''), 16);
              if (!Number.isNaN(parsed)) pColorHex = parsed;
            }
          } catch (e) {}
        }
        pMat.color.setHex(pColorHex);
        partMat.color.setHex(pColorHex);
        cloudMat.color.setHex(pColorHex);

        // Silver/metallic precipitates get metallic lustre; hydroxide/salt precipitates look matte/gelatinous
        const isMetallicPpt =
          curReaction?.id === 'cu_agno3_displacement' ||
          curReaction?.id === 'zn_cuso4_displacement' ||
          curReaction?.id === 'redox_displacement';
        pMat.metalness = isMetallicPpt ? 0.72 : 0.05;
        pMat.roughness = isMetallicPpt ? 0.28 : 0.92;
        partMat.metalness = isMetallicPpt ? 0.75 : 0.08;
        partMat.roughness = isMetallicPpt ? 0.25 : 0.88;

        // Bottom solid sediment bed accumulates as reactionProgress goes from 0 -> 1
        precipitateMesh.visible = true;
        const cakeHeight = Math.max(0.015, 0.16 * reactionProgress);
        precipitateMesh.scale.set(1, cakeHeight / 0.15, 1);
        precipitateMesh.position.y = cakeHeight / 2 + 0.05;

        sedimentMoundsGroup.visible = reactionProgress > 0.15;
        sedimentMoundsGroup.position.y = cakeHeight + 0.045;
        sedimentMoundsGroup.scale.set(1, Math.min(1, reactionProgress * 1.2), 1);

        // Colloidal turbidity cloud peaks mid-reaction, then clarifies as solid phase settles to bottom
        turbidityCloud.visible = true;
        turbidityCloud.scale.set(1, Math.max(0.05, fluidHeight * 0.88), 1);
        turbidityCloud.position.y = (fluidHeight * 0.88) / 2 + 0.06;
        const cloudBell = Math.sin(Math.min(1, reactionProgress) * Math.PI);
        // Colloidal sulfur remains slightly turbid even at completion; crystalline/curdy precipitates clarify more
        const residualTurbidity = curReaction?.id === 'thiosulfate_acid_sulfur' ? 0.38 : 0.08;
        cloudMat.opacity = Math.max(residualTurbidity * reactionProgress, 0.45 * cloudBell);

        // Solid precipitate particles nucleate and settle downward to the sediment bed
        const timeSecP = currentTime * 0.001;
        const bottomLimit = cakeHeight + 0.06;

        particlePool.forEach((p) => {
          p.mesh.visible = true;
          if (overrideMode === 'final') {
            p.mesh.position.y = bottomLimit + (p.phase % 0.03);
            p.mesh.position.x = p.initialX;
            p.mesh.position.z = p.initialZ;
          } else if (!p.settled) {
            p.currentY -= delta * p.settleSpeed;
            p.mesh.position.y = p.currentY;
            p.mesh.position.x = p.initialX + Math.sin(timeSecP * 2.0 + p.phase) * 0.02;
            p.mesh.position.z = p.initialZ + Math.cos(timeSecP * 2.0 + p.phase) * 0.02;
            p.mesh.rotation.x += delta * 1.6;
            p.mesh.rotation.y += delta * 2.2;

            if (p.currentY <= bottomLimit) {
              p.settled = true;
              p.currentY = bottomLimit;
            }
          }
        });
      } else {
        precipitateMesh.visible = false;
        sedimentMoundsGroup.visible = false;
        turbidityCloud.visible = false;
        particlePool.forEach((p) => {
          p.mesh.visible = false;
          p.settled = false;
        });
      }

      // Rotate stir bar
      stirBar.rotation.y += delta * 10.0;

      // Rotate floating potassium chunk if present
      if (kMesh.visible) {
        kMesh.position.y = fluidHeight + 0.05 + Math.sin(currentTime * 0.006) * 0.02;
        kMesh.rotation.y += delta * 2.5;
      }

      // Update thermometer mercury
      const mercHeight = Math.min(1.68, Math.max(0.15, (curTemp / 110) * 1.6));
      merc.scale.set(1, mercHeight, 1);
      merc.position.y = mercHeight / 2 + 0.05;
      mercMat.color.setHex(curTemp > 100 ? 0xf43f5e : curTemp > 75 ? 0xd946ef : 0xef4444);

      // -----------------------------------------------------------------------
      // 3. LIQUID-PHASE EFFERVESCENCE (BUBBLES NUCLEATING & BURSTING AT SURFACE)
      // -----------------------------------------------------------------------
      const isEffervescenceActive = Boolean(
        hasLiquid &&
          overrideMode !== 'initial' &&
          (curReaction?.observableEffects?.producesGas || curTemp >= 98)
      );
      const gasVigor = curReaction?.observableEffects?.gasVigor || (curTemp >= 98 ? 3 : 2);
      const timeSec = currentTime * 0.001;
      const hasSubmergedSolid = solidDefs.length > 0;

      if (isEffervescenceActive) {
        const rawGasColor = curReaction?.observableEffects?.gasColor || '#FFFFFF';
        bubbleMat.color.set(rawGasColor);
        rippleMat.color.set(rawGasColor);
      }

      // Active bubble density scales with reaction vigour (1 -> 18 bubbles, 5 -> 90 bubbles)
      const activeBubbleCount = isEffervescenceActive ? Math.min(90, Math.max(16, Math.round(gasVigor * 18))) : 0;
      const rateFactor = Math.max(0.6, (curTemp / 25) * Math.sqrt(curConc) * (curCat ? 1.5 : 1.0) * (0.45 + gasVigor * 0.28));

      bubblesPool.forEach((bp, idx) => {
        const shouldShow = idx < activeBubbleCount;
        bp.mesh.visible = shouldShow;
        if (shouldShow) {
          // Nucleate at solid surface if a solid reactant is present, otherwise in lower reaction zone
          const baseX = hasSubmergedSolid ? bp.solidSiteX : bp.bulkX;
          const baseZ = hasSubmergedSolid ? bp.solidSiteZ : bp.bulkZ;
          const nucleationY = hasSubmergedSolid ? 0.08 : 0.10;
          const topMeniscusY = Math.max(0.18, fluidHeight + 0.045);

          bp.mesh.position.y += delta * bp.speed * rateFactor;
          // Slight helical hydrodynamic wobble as bubble rises through liquid
          const heightFrac = Math.max(0, Math.min(1, (bp.mesh.position.y - nucleationY) / Math.max(0.1, topMeniscusY - nucleationY)));
          const spread = hasSubmergedSolid ? 1.0 + heightFrac * 0.45 : 1.0;
          bp.mesh.position.x = baseX * spread + Math.sin(timeSec * 6.5 + bp.phase) * 0.022;
          bp.mesh.position.z = baseZ * spread + Math.cos(timeSec * 5.8 + bp.phase) * 0.022;

          // Bubbles expand slightly as they rise toward the meniscus
          const dynScale = bp.baseScale * (0.8 + heightFrac * 0.45);
          bp.mesh.scale.set(dynScale, dynScale, dynScale);

          // Burst at liquid surface and re-nucleate at reaction site
          if (bp.mesh.position.y >= topMeniscusY) {
            bp.mesh.position.y = nucleationY + Math.random() * 0.04;
          }
        }
      });

      // Surface meniscus burst ripples where bubbles pop at the top of the liquid
      const activeRippleCount = isEffervescenceActive ? Math.min(24, Math.max(6, gasVigor * 5)) : 0;
      surfaceRipplesPool.forEach((rp, idx) => {
        const shouldShow = idx < activeRippleCount;
        rp.mesh.visible = shouldShow;
        if (shouldShow) {
          rp.progress = (rp.progress + delta * rp.speed * (0.7 + gasVigor * 0.18)) % 1.0;
          rp.mesh.position.set(rp.x, fluidHeight + 0.062, rp.z);
          const rScale = 0.4 + rp.progress * 1.6;
          rp.mesh.scale.set(rScale, rScale, 1);
        }
      });

      // -----------------------------------------------------------------------
      // 4. AIRBORNE FUMES / COLOURED GAS PLUME (STRICTLY GATED!)
      // Only active when reaction genuinely produces airborne fumes (e.g. brown NO2 gas,
      // white NH4Cl vapour smoke, or violent boiling steam). NEVER active for liquid effervescence!
      // -----------------------------------------------------------------------
      const isAirborneFumeActive = Boolean(
        overrideMode !== 'initial' &&
          (curReaction?.observableEffects?.producesFumesAboveLiquid ||
            curReaction?.observableEffects?.isViolent ||
            curTemp > 98)
      );

      if (isAirborneFumeActive) {
        const fumeHex = curReaction?.observableEffects?.fumeColor || '#F1F5F9';
        vaporMat.color.set(fumeHex);
        vaporMat.opacity = curReaction?.id === 'cu_hno3_oxidation' ? 0.68 : 0.52;
      }

      vaporPool.forEach((vp) => {
        vp.mesh.visible = isAirborneFumeActive;
        if (isAirborneFumeActive) {
          vp.mesh.position.y += delta * vp.speed * (0.75 + gasVigor * 0.25);
          vp.mesh.position.x = vp.seedX + Math.sin(timeSec * 2.6 + vp.phase) * (0.12 + (vp.mesh.position.y - fluidHeight) * 0.18);
          vp.mesh.position.z = vp.seedZ + Math.cos(timeSec * 2.2 + vp.phase) * (0.12 + (vp.mesh.position.y - fluidHeight) * 0.18);

          const currentH = Math.max(0, vp.mesh.position.y - fluidHeight);
          const currentScale = Math.max(0.05, 0.75 + currentH * 1.1 * vp.scaleRate);
          vp.mesh.scale.set(currentScale, currentScale, currentScale);

          if (vp.mesh.position.y > 3.8) {
            vp.mesh.position.y = fluidHeight + 0.08;
            vp.mesh.scale.set(0.6, 0.6, 0.6);
          }
        }
      });

      // Violent Explosions (Crash-proof scales)
      const isViolent = Boolean(overrideMode !== 'initial' && curReaction?.observableEffects?.isViolent);
      fireballMesh.visible = isViolent;
      coronaMesh.visible = isViolent;
      shockwaveMesh1.visible = isViolent;
      shockwaveMesh2.visible = isViolent;

      if (isViolent) {
        const pulse = Math.max(0.2, 1.0 + Math.sin(timeSec * 28) * 0.3);
        fireballMesh.scale.set(pulse, pulse * 1.25, pulse);
        fireballMesh.position.y = fluidHeight + 0.35;
        coronaMesh.scale.set(pulse * 1.2, pulse * 1.3, pulse * 1.2);
        coronaMesh.position.y = fluidHeight + 0.35;

        const sw1 = Math.max(0.05, (shockwaveMesh1.scale.x + delta * 3.2) % 3.2);
        shockwaveMesh1.scale.set(sw1, sw1, 1);
        shockwaveMesh1.position.y = fluidHeight + 0.15;

        const sw2 = Math.max(0.05, (shockwaveMesh2.scale.x + delta * 2.4) % 2.8);
        shockwaveMesh2.scale.set(sw2, sw2, 1);
        shockwaveMesh2.position.y = fluidHeight + 0.25;

        reactionPointLight.intensity = Math.max(0, 5.0 + Math.sin(timeSec * 40) * 4.0);

        sparksPool.forEach((sp) => {
          sp.mesh.visible = true;
          sp.life += delta;
          sp.mesh.position.x += sp.vx * delta;
          sp.mesh.position.y += sp.vy * delta;
          sp.mesh.position.z += sp.vz * delta;
          sp.vy -= 9.8 * delta;

          if (sp.mesh.position.y < -0.1) {
            sp.mesh.position.y = -0.1;
            sp.vy = -sp.vy * 0.45;
          }

          if (sp.life > sp.maxLife) {
            sp.life = 0;
            sp.mesh.position.set(0, fluidHeight + 0.25, 0);
            const angle = Math.random() * Math.PI * 2;
            const speedH = 1.0 + Math.random() * 2.8;
            sp.vx = Math.cos(angle) * speedH;
            sp.vy = 2.5 + Math.random() * 4.2;
            sp.vz = Math.sin(angle) * speedH;
          }
        });

        beakerGroup.position.x = (beakerCenter.x || 0) + (Math.random() - 0.5) * 0.045;
        beakerGroup.position.z = (beakerCenter.z || 0) + (Math.random() - 0.5) * 0.045;
      } else {
        sparksPool.forEach((sp) => (sp.mesh.visible = false));
        reactionPointLight.intensity = 0;
        beakerGroup.position.copy(beakerCenter);
      }

      // Bottle fill heights
      bottleFills.forEach(({ id, fillMesh, initialQty }) => {
        const remaining = curInv[id] ?? initialQty;
        const scale = Math.max(0.05, remaining / initialQty);
        fillMesh.scale.set(1, scale, 1);
        fillMesh.position.y = (0.45 * scale) / 2 + 0.04;
      });

      try {
        renderer.render(scene, camera);
      } catch (err) {
        console.warn('Chemistry render recovered:', err);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      dragManager.dispose();
      studioEnv.dispose();
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [beakerCenter]);

  const stageLabel = !activeReaction
    ? 'Initial / Standby'
    : uiReactionProgress <= 0.05
    ? 'Initial State (Unmixed Reactants)'
    : uiReactionProgress < 0.98
    ? `Reacting (${Math.round(uiReactionProgress * 100)}%)`
    : 'Final State (Reaction Complete)';

  return (
    <div className="flex flex-col gap-4">
      {/* Violent Explosion Hazard Alert Banner */}
      {activeReaction?.observableEffects?.isViolent && (
        <div className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white text-xs font-bold p-3 rounded-2xl shadow-md flex items-center gap-3 border-2 border-amber-300">
          <Flame className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
          <div className="text-left">
            <div className="uppercase tracking-wider text-[10px] text-amber-200 font-extrabold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>VIOLENT EXOTHERMIC DETONATION!</span>
            </div>
            <div className="text-xs font-semibold leading-snug">{activeReaction.observableEffects?.description || 'Rapid exothermic gas generation.'}</div>
          </div>
        </div>
      )}

      {/* Effervescence / Airborne Gas Banner */}
      {!activeReaction?.observableEffects?.isViolent && activeReaction?.observableEffects?.producesGas && (
        <div className="w-full bg-sky-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-2 border border-sky-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>
              {activeReaction.observableEffects.producesFumesAboveLiquid ? (
                <>
                  Airborne Gas & Effervescence: <strong>{activeReaction.observableEffects?.gasName || 'Gas'}</strong> (Visible coloured fumes rising above liquid)
                </>
              ) : (
                <>
                  Liquid-Phase Effervescence: <strong>{activeReaction.observableEffects?.gasName || 'Gas'}</strong> (Bubbles nucleating in liquid & bursting at meniscus — no smoke)
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-sky-800/90 px-2 py-0.5 rounded border border-sky-400/40 shrink-0">
            Vigour: {activeReaction.observableEffects.gasVigor || 2}/5
          </span>
        </div>
      )}

      {/* Initial vs During vs Final Visual State Progression Bar */}
      {activeReaction && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700 shadow-sm space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Visual State Progression:
              </span>
              <span className="text-xs font-semibold text-white bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                {stageLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStageOverride('initial')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  stageOverride === 'initial'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. Initial State
              </button>
              <button
                type="button"
                onClick={handleReplayReaction}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  stageOverride === 'auto'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>2. Replay Reaction</span>
              </button>
              <button
                type="button"
                onClick={() => setStageOverride('final')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  stageOverride === 'final'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                3. Final State
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 transition-all duration-150"
              style={{ width: `${Math.round(uiReactionProgress * 100)}%` }}
            />
          </div>

          {/* Initial vs Final Appearance Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-0.5">
                Initial Appearance (Before Reaction)
              </div>
              <div className="text-slate-200 leading-snug">
                {activeReaction.observableEffects.initialAppearance ||
                  activeReagentsList
                    .map((r) => `${r.def.formula}: ${r.def.appearanceDescription || (isReagentColorless(r.def) ? 'Colourless' : 'Coloured')}`)
                    .join(' + ')}
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                Final Appearance (After Reaction)
              </div>
              <div className="text-slate-200 leading-snug">
                {activeReaction.observableEffects.finalAppearance || activeReaction.observableEffects.description}
              </div>
            </div>
          </div>
        </div>
      )}

      <Global3DViewer
        title="3D Virtual Reaction Laboratory"
        subtitle={
          activeReaction?.observableEffects?.isViolent
            ? `💥 ${activeReaction.name} — VIOLENT RUNAWAY EXPLOSION!`
            : activeReaction
            ? `⚗️ ${activeReaction.name}`
            : 'Pick up chemical bottles & drag over the beaker to pour'
        }
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        onTryIt={onTryIt}
        tryItLabel="TRY IT"
        onResetCamera={() => {
          if (controlsRef.current) {
            controlsRef.current.reset(7.8, 0, Math.PI / 3, new THREE.Vector3(0, 1.05, 0.4));
          }
        }}
        onResetSimulation={onResetBeaker}
        modelPosition={modelPosition}
        onModelPositionChange={setModelPosition}
        onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
        positionRange={{ minX: -6, maxX: 6, minY: -4, maxY: 4, step: 0.1 }}
        enablePositionControls={true}
        telemetry={[
          { label: 'Temp', value: `${temperature.toFixed(1)}°C` },
          { label: 'Volume', value: `${totalVolume} mL` },
          {
            label: 'State',
            value: activeReaction?.observableEffects?.isViolent
              ? '💥 DETONATION'
              : activeReaction
              ? uiReactionProgress < 0.98
                ? '⚗️ REACTING'
                : '✅ COMPLETE'
              : 'STABLE',
          },
        ]}
        heightClass="h-[400px] lg:h-[450px]"
        bottomBarExtras={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMolecularView(!molecularView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                molecularView
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/95 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{molecularView ? 'Molecular View ON' : 'Molecular View'}</span>
            </button>
          </div>
        }
      >
        <div ref={mountRef} className="w-full h-full relative">
          {/* 3D Component Labels Overlay */}
          {showLabels && (
            <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none">
              <div className="bg-slate-900/85 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] max-w-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-sky-400 uppercase tracking-wider text-[10px]">
                  <span>Beaker Composition HUD</span>
                  <span className="text-slate-300 font-mono font-normal">Cap: 250 mL</span>
                </div>
                {activeReagentsList.length === 0 ? (
                  <div className="text-slate-400 italic text-[11px]">Beaker is currently empty. Add reagents!</div>
                ) : (
                  <div className="space-y-1">
                    {activeReagentsList.map(({ id, amount, def }) => {
                      const colorless = isReagentColorless(def);
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                colorless ? 'border border-slate-300 bg-white/30' : 'shadow-xs'
                              }`}
                              style={colorless ? undefined : { backgroundColor: def.color }}
                              title={def.appearanceDescription || (colorless ? 'Colourless' : def.color)}
                            />
                            <span className="font-semibold text-slate-100 truncate">{def.formula}</span>
                            <span className="text-slate-400 text-[10px] truncate">
                              ({colorless ? 'Colourless' : def.name})
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 shrink-0">
                            {amount} {def.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeReaction && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[10px]">
                    <div className="text-amber-300 font-semibold flex items-center gap-1">
                      <span>Reaction:</span>
                      <span className="text-white truncate">{activeReaction.name}</span>
                    </div>
                    {activeReaction.observableEffects.producesPrecipitate && (
                      <div className="text-indigo-300 flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full border border-white/40 shrink-0"
                          style={{ backgroundColor: activeReaction.observableEffects.precipitateColor || '#FFFFFF' }}
                        />
                        <span className="truncate">
                          Solid Phase: {activeReaction.observableEffects.precipitateName || 'Precipitate↓'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visual Over-Beaker Pouring Indicator */}
          {isOverBeaker && !isPouringAnim && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
              <Droplet className="w-4 h-4" />
              <span>Release mouse/finger to Pour into Beaker</span>
            </div>
          )}

          {/* Pouring Animation Banner */}
          {isPouringAnim && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Pouring {pouringReagentName}...</span>
            </div>
          )}

          {/* Hovered Reagent Tooltip */}
          {hoveredReagent && (
            <div className="absolute bottom-16 right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs max-w-xs pointer-events-none space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{hoveredReagent.name}</span>
                <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-semibold">
                  {hoveredReagent.formula}
                </span>
              </div>
              {hoveredReagent.appearanceDescription && (
                <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Appearance: {hoveredReagent.appearanceDescription}
                </div>
              )}
              {hoveredReagent.hazard && (
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{hoveredReagent.hazard}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 leading-relaxed">{hoveredReagent.description}</p>
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Remaining Inventory:</span>
                <span className="font-bold text-slate-900">
                  {inventory[hoveredReagent.id] ?? hoveredReagent.initialQuantity} {hoveredReagent.unit}
                </span>
              </div>
            </div>
          )}
        </div>
      </Global3DViewer>

      {/* Interactive Reagent Inventory Strip with Hazard & Appearance Badges (only if not hidden) */}
      {!hideReagentShelf && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Chemical Reagents Shelf (Drag bottle in 3D or Click to Add)
              </h3>
            </div>
            {totalVolume > 0 && (
              <button
                onClick={onResetBeaker}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 font-semibold transition-colors cursor-pointer px-3 py-1 rounded-lg bg-slate-100 hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Empty Beaker</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2.5">
            {REAGENTS.map((r) => {
              const inBeaker = reagentsInBeaker[r.id] || 0;
              const remaining = inventory[r.id] ?? r.initialQuantity;
              const colorless = isReagentColorless(r);
              return (
                <button
                  key={r.id}
                  onClick={() => onPourReagent(r.id, r.pourAmount)}
                  disabled={remaining <= 0}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    inBeaker > 0
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white shadow-2xs'
                  } ${remaining <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                          colorless ? 'border-2 border-slate-300 bg-slate-50' : 'border border-black/15 shadow-2xs'
                        }`}
                        style={colorless ? undefined : { backgroundColor: r.color }}
                        title={r.appearanceDescription || (colorless ? 'Colourless solution' : r.color)}
                      />
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {remaining} {r.unit}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">{r.formula}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{r.name}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">
                      {colorless ? 'Colourless (aq)' : r.appearanceDescription || r.state}
                    </div>
                    {r.hazard && (
                      <div className="text-[9px] font-bold text-rose-700 bg-rose-50 rounded px-1 py-0.5 mt-1 truncate border border-rose-100">
                        {r.hazard}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-semibold text-emerald-700 flex items-center justify-between">
                    <span>{inBeaker > 0 ? `${inBeaker} ${r.unit} in beaker` : `+ Add ${r.pourAmount}${r.unit}`}</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

