import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { CELL_ORGANELLES } from '../../data/biologyData';
import { OrganelleInfo } from '../../types/biology';
import { Global3DViewer } from '../common/Global3DViewer';
import { EducationalExplanationBox, ExplanationData } from '../common/EducationalExplanationBox';
import { Dna, Sparkles, BookOpen } from 'lucide-react';
import { setupPreBatch1StudioEnvironment } from '../../simulations/preBatch1VisualUpgradeStudio';

interface CellSceneProps {
  selectedOrganelleId: string;
  onSelectOrganelle: (id: string) => void;
  onTryIt?: () => void;
}

export const CellScene: React.FC<CellSceneProps> = ({ selectedOrganelleId, onSelectOrganelle, onTryIt }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  const organelle = CELL_ORGANELLES.find((o) => o.id === selectedOrganelleId) || CELL_ORGANELLES[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 3,
      maxDistance: 16,
    });
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.38);
    keyLight.position.set(8, 10, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-8, -4, -6);
    scene.add(rimLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -2.85, {
      stageRadius: 4.6,
    });

    // Universal Position Parent Group
    const positionGroup = new THREE.Group();
    positionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    positionGroupRef.current = positionGroup;
    scene.add(positionGroup);

    const cellGroup = new THREE.Group();
    positionGroup.add(cellGroup);

    // Organelle mesh dictionary for raycasting
    const interactiveMeshes: { mesh: THREE.Object3D; id: string }[] = [];

    // 1. Outer Cell Membrane & Cytoplasm (3/4 cutaway dome)
    const membraneGeo = new THREE.SphereGeometry(2.6, 48, 48, 0, Math.PI * 1.5, 0, Math.PI);
    const isMembraneSelected = selectedOrganelleId === 'membrane';
    const membraneMat = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7b7,
      transmission: 0.6,
      opacity: 0.5,
      transparent: true,
      roughness: 0.2,
      side: THREE.DoubleSide,
      emissive: isMembraneSelected ? 0x10b981 : 0x000000,
      emissiveIntensity: isMembraneSelected ? 0.3 : 0,
    });
    const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
    cellGroup.add(membraneMesh);
    interactiveMeshes.push({ mesh: membraneMesh, id: 'membrane' });

    // 2. Central Nucleus & Nucleolus
    const isNucleusSelected = selectedOrganelleId === 'nucleus';
    const nucleusGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8, // soft indigo
      roughness: 0.3,
      metalness: 0.1,
      emissive: isNucleusSelected ? 0x6366f1 : 0x000000,
      emissiveIntensity: isNucleusSelected ? 0.5 : 0,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusMesh.position.set(-0.2, 0.1, 0.1);
    cellGroup.add(nucleusMesh);
    interactiveMeshes.push({ mesh: nucleusMesh, id: 'nucleus' });

    // Dense Nucleolus inside nucleus
    const nucleolusGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const nucleolusMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.2 });
    const nucleolusMesh = new THREE.Mesh(nucleolusGeo, nucleolusMat);
    nucleolusMesh.position.set(-0.2, 0.2, 0.3);
    cellGroup.add(nucleolusMesh);

    // 3. Mitochondria (Oval capsules with folded inner ribbons)
    const isMitoSelected = selectedOrganelleId === 'mitochondria';
    const mitoMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      emissive: isMitoSelected ? 0xd97706 : 0x000000,
      emissiveIntensity: isMitoSelected ? 0.6 : 0,
    });
    const mitoPositions: [number, number, number, number, number][] = [
      [1.4, 0.6, 0.4, 0.5, 0.8],
      [0.8, -1.2, 0.6, -0.7, 0.4],
      [-1.2, -1.0, 0.2, 0.9, -0.3],
    ];

    mitoPositions.forEach(([x, y, z, rx, ry]) => {
      const mitoGroup = new THREE.Group();
      mitoGroup.position.set(x, y, z);
      mitoGroup.rotation.set(rx, ry, 0);

      const capsuleGeo = new THREE.CapsuleGeometry(0.24, 0.5, 16, 24);
      const capsule = new THREE.Mesh(capsuleGeo, mitoMat);
      mitoGroup.add(capsule);

      cellGroup.add(mitoGroup);
      interactiveMeshes.push({ mesh: capsule, id: 'mitochondria' });
    });

    // 4. Endoplasmic Reticulum (Curved winding tubules wrapping nucleus)
    const isErSelected = selectedOrganelleId === 'endoplasmic_reticulum';
    const erMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.4,
      side: THREE.DoubleSide,
      emissive: isErSelected ? 0x0891b2 : 0x000000,
      emissiveIntensity: isErSelected ? 0.5 : 0,
    });

    for (let r = 1.05; r <= 1.45; r += 0.2) {
      const torusGeo = new THREE.TorusGeometry(r, 0.08, 16, 32, Math.PI * 1.2);
      const torus = new THREE.Mesh(torusGeo, erMat);
      torus.position.set(-0.2, 0.1, 0.1);
      torus.rotation.set(Math.PI / 4, 0.3, 0);
      cellGroup.add(torus);
      interactiveMeshes.push({ mesh: torus, id: 'endoplasmic_reticulum' });
    }

    // 5. Golgi Apparatus (Stacked curved cisternae)
    const isGolgiSelected = selectedOrganelleId === 'golgi_apparatus';
    const golgiMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.35,
      emissive: isGolgiSelected ? 0xdb2777 : 0x000000,
      emissiveIntensity: isGolgiSelected ? 0.6 : 0,
    });

    for (let i = 0; i < 4; i++) {
      const golgiGeo = new THREE.TorusGeometry(0.6 + i * 0.12, 0.06, 12, 24, Math.PI * 0.7);
      const golgi = new THREE.Mesh(golgiGeo, golgiMat);
      golgi.position.set(-1.1, 1.1 + i * 0.1, 0.5);
      golgi.rotation.set(0.6, 0.4, 0.8);
      cellGroup.add(golgi);
      interactiveMeshes.push({ mesh: golgi, id: 'golgi_apparatus' });
    }

    // 6. Ribosomes (Tiny scattered granules)
    const isRiboSelected = selectedOrganelleId === 'ribosomes';
    const riboGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const riboMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: isRiboSelected ? 0xe11d48 : 0x000000,
      emissiveIntensity: isRiboSelected ? 0.8 : 0,
    });
    for (let i = 0; i < 40; i++) {
      const ribo = new THREE.Mesh(riboGeo, riboMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const rad = 1.0 + Math.random() * 1.3;
      ribo.position.set(rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta), rad * Math.cos(phi));
      cellGroup.add(ribo);
    }

    // Raycast Click Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCellClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const candidateMeshes = interactiveMeshes.map((item) => item.mesh);
      const intersects = raycaster.intersectObjects(candidateMeshes, true);
      if (intersects.length > 0) {
        const found = interactiveMeshes.find((item) => item.mesh === intersects[0].object);
        if (found) {
          onSelectOrganelle(found.id);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCellClick);

    // Idle Gentle Rotation
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (!controls.isPointerDown) {
        cellGroup.rotation.y += delta * 0.1;
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
      renderer.domElement.removeEventListener('click', handleCellClick);
      studioEnv.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedOrganelleId]);

  const cellExplanationData: ExplanationData = {
    title: organelle.name,
    badge: 'Cellular Organelle',
    subtitle: organelle.pronunciation || 'Eukaryotic Subcellular Structure',
    whatIsIt: organelle.structure || `A specialized membrane-bound structure within eukaryotic cells.`,
    whatDoesItDo: organelle.function,
    realLifeExample:
      organelle.id === 'mitochondria'
        ? 'The power generator of a city: producing chemical ATP packets to power all cellular work.'
        : organelle.id === 'nucleus'
        ? 'The central command office storing the master genome blueprint to direct protein synthesis.'
        : organelle.id === 'golgi'
        ? 'The shipping warehouse: tagging, folding, and dispatching cellular products in vesicles.'
        : organelle.id === 'er'
        ? 'The factory assembly line where ribosomes synthesize polypeptide chains and lipid membranes.'
        : organelle.id === 'lysosome'
        ? 'The cellular recycling center and incinerator breaking down expired organelles with acid hydrolases.'
        : 'A smart security gatekeeper controlling molecular transport across the phospholipid bilayer.',
    whyTitle: 'BIOLOGICAL ROLE IN CELLULAR METABOLISM',
    whyExplanation: `${organelle.curiousFact} Dimensions: ${organelle.dimensions || 'Microscopic nanoscale'}.`,
    examConnection:
      organelle.id === 'mitochondria'
        ? 'Endosymbiotic Theory: Mitochondria have their own circular DNA and double membrane, inherited maternally.'
        : organelle.id === 'nucleus'
        ? 'Houses the nucleolus for ribosome production and chromatin (DNA wound around histone proteins).'
        : 'Eukaryotic compartmentalization enables conflicting biochemical reactions to run in isolated micro-environments.',
  };

  return (
    <div className="flex flex-col gap-4">
      <Global3DViewer
        title="3D Eukaryotic Animal Cell Explorer"
        subtitle={`Active Organelle: ${organelle.name}`}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        onResetCamera={() => {
          if (controlsRef.current) {
            controlsRef.current.reset(7.5, 0, Math.PI / 2, new THREE.Vector3(0, 0, 0));
          }
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
      <EducationalExplanationBox data={cellExplanationData} />

      {/* Organelle Select Tabs & Deep Bio Dossier */}
      <div id="cell-controls-panel" className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all">
        {/* Organelle Selector Strip */}
        <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dna className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Select Cellular Organelle
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {CELL_ORGANELLES.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onSelectOrganelle(o.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                    o.id === selectedOrganelleId
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                    <span>{o.name}</span>
                  </div>
                  {o.dimensions && (
                    <span className={`text-[10px] ${o.id === selectedOrganelleId ? 'text-slate-300' : 'text-slate-400'}`}>
                      {o.dimensions}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Organelle Detailed Dossier */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{organelle.name}</h3>
                {organelle.pronunciation && (
                  <p className="text-xs text-slate-400 font-mono">{organelle.pronunciation}</p>
                )}
              </div>
              <span
                className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${organelle.color}20`, color: organelle.color }}
              >
                Organelle
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Biological Function:</span>
                <p>{organelle.function}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Ultrastructure:</span>
                <p>{organelle.structure}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-amber-800 bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Curiosity Fact: </span>
              <span>{organelle.curiousFact}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
