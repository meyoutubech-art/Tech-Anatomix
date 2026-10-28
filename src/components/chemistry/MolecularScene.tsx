import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { MoleculeDefinition, AtomData } from '../../types/chemistry';
import { MOLECULES } from '../../data/moleculesData';
import { Global3DViewer } from '../common/Global3DViewer';
import { EducationalExplanationBox, ExplanationData } from '../common/EducationalExplanationBox';
import { Atom, Info, Layers, Sun, Eye, RotateCcw } from 'lucide-react';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';
import { buildDomainEnvironmentStageGroup } from '../../utils/immersiveEnvironmentPreset';

type MolecularLightingMode = 'studio-specular' | 'high-contrast-dark' | 'daylight-lab';
type MolecularCameraAngle = 'iso' | 'front' | 'top' | 'side';

interface MolecularSceneProps {
  selectedMoleculeId: string;
  onSelectMolecule: (id: string) => void;
  onTryIt?: () => void;
}

export const MolecularScene: React.FC<MolecularSceneProps> = ({ selectedMoleculeId, onSelectMolecule, onTryIt }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedAtomIndex, setSelectedAtomIndex] = useState<number | null>(null);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lightingMode, setLightingMode] = useState<MolecularLightingMode>('studio-specular');
  const [cameraAngle, setCameraAngle] = useState<MolecularCameraAngle>('iso');
  const positionGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLight1Ref = useRef<THREE.DirectionalLight | null>(null);
  const dirLight2Ref = useRef<THREE.DirectionalLight | null>(null);

  // Reset position when molecule selection changes
  useEffect(() => {
    setModelPosition({ x: 0, y: 0 });
  }, [selectedMoleculeId]);

  useEffect(() => {
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  const molecule = MOLECULES.find((m) => m.id === selectedMoleculeId) || MOLECULES[0];
  const selectedAtom = selectedAtomIndex !== null ? molecule.atoms[selectedAtomIndex] : null;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1628);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 2.0,
      maxDistance: 15.0,
    });
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.56);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.42);
    dirLight1.position.set(6, 8, 10);
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.68);
    dirLight2.position.set(-6, -4, -6);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    // Optional subtle grid
    const grid = new THREE.GridHelper(8, 16, 0x38bdf8, 0x1e4e58);
    grid.position.y = -2.2;
    grid.visible = showGrid;
    styleStudioGridHelper(grid);
    scene.add(grid);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -2.2, {
      stageRadius: 4.4,
    });

    // Molecular Studio 3D Stage Platform
    const molecularStage = buildDomainEnvironmentStageGroup('molecular-studio', -2.2, 3.6);
    scene.add(molecularStage);

    // Universal Position Parent Group
    const positionGroup = new THREE.Group();
    positionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    positionGroupRef.current = positionGroup;
    scene.add(positionGroup);

    // Molecule root group
    const molGroup = new THREE.Group();
    positionGroup.add(molGroup);

    // Atom Meshes
    const atomMeshes: THREE.Mesh[] = [];
    molecule.atoms.forEach((atom, idx) => {
      const atomGeo = new THREE.SphereGeometry(atom.radius, 32, 32);
      const isSelected = selectedAtomIndex === idx;

      const atomMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(atom.color),
        roughness: 0.25,
        metalness: 0.1,
        emissive: isSelected ? 0x0284c7 : 0x000000,
        emissiveIntensity: isSelected ? 0.4 : 0,
      });

      const atomMesh = new THREE.Mesh(atomGeo, atomMat);
      atomMesh.position.set(...atom.position);
      atomMesh.userData = { atomIndex: idx };
      molGroup.add(atomMesh);
      atomMeshes.push(atomMesh);

      // Selection Halo Ring
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(atom.radius + 0.08, atom.radius + 0.14, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(...atom.position);
        molGroup.add(ring);
      }
    });

    // Covalent Bond Cylinders
    const bondMat = new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.65, clearcoat: 0.35 });
    molecule.bonds.forEach((bond) => {
      const a1 = molecule.atoms[bond.atom1];
      const a2 = molecule.atoms[bond.atom2];
      if (!a1 || !a2) return;

      const p1 = new THREE.Vector3(...a1.position);
      const p2 = new THREE.Vector3(...a2.position);
      const distance = p1.distanceTo(p2);
      const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      if (bond.order === 1) {
        const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, distance, 16);
        const bondMesh = new THREE.Mesh(bondGeo, bondMat);
        bondMesh.position.copy(midpoint);
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        molGroup.add(bondMesh);
      } else if (bond.order === 2) {
        // Double bond: two parallel cylinders
        const offsetAxis = new THREE.Vector3(0, 0, 1).cross(direction).normalize().multiplyScalar(0.1);
        [-1, 1].forEach((sign) => {
          const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, distance, 16);
          const bondMesh = new THREE.Mesh(bondGeo, bondMat);
          const pos = new THREE.Vector3().copy(midpoint).addScaledVector(offsetAxis, sign);
          bondMesh.position.copy(pos);
          bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
          molGroup.add(bondMesh);
        });
      }
    });

    // Atom Raycaster Click Detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleAtomClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(atomMeshes, false);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.atomIndex;
        setSelectedAtomIndex(idx);
      } else {
        setSelectedAtomIndex(null);
      }
    };
    renderer.domElement.addEventListener('click', handleAtomClick);

    // Subtle idle gentle auto-rotation when user is not dragging
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (!controls.isPointerDown) {
        molGroup.rotation.y += delta * 0.15;
      }

      renderer.render(scene, camera);
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
      renderer.domElement.removeEventListener('click', handleAtomClick);
      studioEnv.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [molecule, selectedAtomIndex, showGrid]);

  const explanationData: ExplanationData = selectedAtom
    ? {
        title: selectedAtom.label,
        badge: 'Selected Atom Component',
        subtitle: `Atomic Number: ${selectedAtom.atomicNumber} · Electronegativity: ${selectedAtom.electronegativity ?? 'N/A'}`,
        whatIsIt: `A single ${selectedAtom.label} atom situated in the covalent framework of ${molecule.name} (${molecule.formula}).`,
        whatDoesItDo: 'Shares valence electrons through covalent bonds to fulfill its stable electron shell configuration.',
        realLifeExample: 'Atoms of this element are fundamental building blocks of water, organic tissue, and the Earth’s atmosphere.',
        whyTitle: 'HOW DOES THIS ATOM AFFECT MOLECULAR POLARITY?',
        whyExplanation: `Electronegativity is ${selectedAtom.electronegativity ?? 'N/A'}. ${selectedAtom.label === 'O' ? 'High electronegativity creates strong partial negative charge (δ⁻) enabling hydrogen bonding between adjacent water molecules.' : 'Differences in electronegativity across the bond create permanent bond dipole vectors.'}`,
        examConnection: 'Periodic Trend: Electronegativity increases across periods from left to right, and decreases down groups.',
        onClearSelection: () => setSelectedAtomIndex(null),
      }
    : {
        title: `${molecule.name} (${molecule.formula})`,
        badge: 'Molecular Geometry',
        subtitle: `${molecule.geometry} · Molar Mass: ${molecule.molarMass}`,
        whatIsIt: `${molecule.name} is a chemical molecule with molecular formula ${molecule.formula} and ${molecule.geometry.toLowerCase()} 3D geometry.`,
        howDoesItWork: molecule.description,
        realLifeExample:
          molecule.id === 'h2o'
            ? 'Water (H₂O): Its bent polar shape makes ice float on lakes, preserving freshwater aquatic life during freezing winters.'
            : molecule.id === 'ch4'
            ? 'Methane: The primary constituent of natural gas fuel used in household heating and cooking ranges.'
            : molecule.id === 'co2'
            ? 'Carbon dioxide: The carbonated fizz in soda beverages and essential gas absorbed by plants during photosynthesis.'
            : molecule.id === 'c2h5oh'
            ? 'Ethanol: The active disinfectant in medical hand sanitizers and renewable biofuel in vehicles.'
            : 'Glucose: The vital sugar carried in human blood circulation to fuel muscle contraction and cellular metabolism.',
        whyTitle: 'WHY DOES IT HAVE THIS 3D SHAPE?',
        whyExplanation: `VSEPR (Valence Shell Electron Pair Repulsion) theory dictates that electron pairs around the central atom position themselves as far apart as possible, producing this observed ${molecule.geometry} shape.`,
        examConnection: 'VSEPR Theory: Spatial molecular geometry is determined by the balance of bonding electron pairs and lone pairs on the central atom.',
        formula: molecule.formula,
      };

  // Sync Molecular Studio Lighting Mode
  useEffect(() => {
    if (!sceneRef.current || !ambientLightRef.current || !dirLight1Ref.current || !dirLight2Ref.current) return;
    if (lightingMode === 'daylight-lab') {
      sceneRef.current.background = new THREE.Color(0x16263d);
      ambientLightRef.current.intensity = 0.85;
      dirLight1Ref.current.intensity = 1.65;
      dirLight1Ref.current.color.setHex(0xffffff);
      dirLight2Ref.current.intensity = 0.82;
      dirLight2Ref.current.color.setHex(0xe0f2fe);
    } else if (lightingMode === 'high-contrast-dark') {
      sceneRef.current.background = new THREE.Color(0x050914);
      ambientLightRef.current.intensity = 0.36;
      dirLight1Ref.current.intensity = 1.75;
      dirLight1Ref.current.color.setHex(0xf8fafc);
      dirLight2Ref.current.intensity = 0.92;
      dirLight2Ref.current.color.setHex(0x38bdf8);
    } else {
      sceneRef.current.background = new THREE.Color(0x0b1628);
      ambientLightRef.current.intensity = 0.56;
      dirLight1Ref.current.intensity = 1.42;
      dirLight1Ref.current.color.setHex(0xffffff);
      dirLight2Ref.current.intensity = 0.68;
      dirLight2Ref.current.color.setHex(0x93c5fd);
    }
  }, [lightingMode]);

  const applyMolecularCameraPreset = (angle: MolecularCameraAngle) => {
    setCameraAngle(angle);
    if (!controlsRef.current) return;
    if (angle === 'front') {
      controlsRef.current.reset(6.5, 0, Math.PI / 2, new THREE.Vector3(0, 0, 0));
    } else if (angle === 'top') {
      controlsRef.current.reset(6.5, 0, 0.14, new THREE.Vector3(0, 0, 0));
    } else if (angle === 'side') {
      controlsRef.current.reset(6.5, Math.PI / 2, Math.PI / 2, new THREE.Vector3(0, 0, 0));
    } else {
      controlsRef.current.reset(6.5, 0.45, 1.18, new THREE.Vector3(0, 0, 0));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Molecular Studio Environment Controls */}
      <div
        id="molecular-studio-environment-deck"
        data-testid="molecular-studio-environment-deck"
        className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/95 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs shadow-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="molecular-representation-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-semibold text-[11px]"
          >
            <Atom className="w-3.5 h-3.5 text-cyan-400" />
            Representation: 3D Covalent Ball-and-Stick Geometry (VSEPR)
          </span>
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5">
            <Sun className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
            {(
              [
                { id: 'studio-specular', label: 'Studio Specular' },
                { id: 'daylight-lab', label: 'Daylight Lab' },
                { id: 'high-contrast-dark', label: 'High-Contrast Dark' },
              ] as { id: MolecularLightingMode; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setLightingMode(preset.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  lightingMode === preset.id
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5">
            <Eye className="w-3.5 h-3.5 text-sky-400 ml-1.5 mr-0.5" />
            {(
              [
                { id: 'iso', label: '3D Orbit' },
                { id: 'front', label: 'Front' },
                { id: 'top', label: 'Top' },
                { id: 'side', label: 'Side' },
              ] as { id: MolecularCameraAngle; label: string }[]
            ).map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => applyMolecularCameraPreset(view.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  cameraAngle === view.id
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-testid="molecular-reset-camera-btn"
            onClick={() => applyMolecularCameraPreset('iso')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" />
            Reset Camera
          </button>
        </div>
      </div>

      {/* 3D Molecular Viewport */}
      <Global3DViewer
        title={`3D Molecular Model: ${molecule.name} (${molecule.formula})`}
        subtitle={`${molecule.geometry} · ${molecule.molarMass}`}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        onResetCamera={() => {
          applyMolecularCameraPreset('iso');
        }}
        onResetSimulation={() => {
          setSelectedAtomIndex(null);
          setModelPosition({ x: 0, y: 0 });
        }}
        onTryIt={onTryIt}
        modelPosition={modelPosition}
        onModelPositionChange={setModelPosition}
        onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
        enablePositionControls={true}
      >
        <div ref={mountRef} className="w-full h-full" />
      </Global3DViewer>

      {/* Educational Explanation Box (Directly below 3D window) */}
      <EducationalExplanationBox data={explanationData} />

      {/* Molecule Selection Strip & Selected Atom Details */}
      <div id="molecule-controls-panel" className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all">
        {/* Molecule Selector */}
        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Select Molecular Structure
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {MOLECULES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMolecule(m.id);
                  setSelectedAtomIndex(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  m.id === selectedMoleculeId
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-sm leading-tight">{m.formula}</div>
                <div className={`text-xs mt-0.5 ${m.id === selectedMoleculeId ? 'text-slate-300' : 'text-slate-500'}`}>
                  {m.name}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p>{molecule.description}</p>
          </div>
        </div>

        {/* Selected Atom Inspector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Atom className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Atom Inspector
            </h3>
          </div>

          {selectedAtom ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Element:</span>
                <span className="font-semibold text-slate-900">{selectedAtom.label}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Atomic Number:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedAtom.atomicNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Electronegativity:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedAtom.electronegativity ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Coordinates:</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  [{selectedAtom.position.map((v) => v.toFixed(2)).join(', ')}]
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Click any atom sphere in the 3D model to inspect its chemical properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
