import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { DNA_BASE_PAIRS } from '../../data/biologyData';
import { DnaBasePairInfo } from '../../types/biology';
import { Global3DViewer } from '../common/Global3DViewer';
import { EducationalExplanationBox, ExplanationData } from '../common/EducationalExplanationBox';
import { Dna, Sparkles, Layers, Info } from 'lucide-react';
import { setupPreBatch1StudioEnvironment } from '../../simulations/preBatch1VisualUpgradeStudio';

interface DnaSceneProps {
  selectedPairId: string;
  onSelectPair: (id: string) => void;
  onTryIt?: () => void;
}

export const DnaScene: React.FC<DnaSceneProps> = ({ selectedPairId, onSelectPair, onTryIt }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [uncoilFactor, setUncoilFactor] = useState(0); // 0 = standard B-DNA double helix, 1 = uncoiled replication fork
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  const activePair = DNA_BASE_PAIRS.find((p) => p.id === selectedPairId) || DNA_BASE_PAIRS[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 3,
      maxDistance: 20,
    });
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.38);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.62);
    fillLight.position.set(-6, -6, -4);
    scene.add(fillLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -3.75, {
      stageRadius: 4.4,
    });

    // Universal Position Parent Group
    const positionGroup = new THREE.Group();
    positionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    positionGroupRef.current = positionGroup;
    scene.add(positionGroup);

    const dnaRoot = new THREE.Group();
    positionGroup.add(dnaRoot);

    // Build Right-Handed B-DNA Double Helix Model (~10.5 bp/turn, 138 deg strand offset for major/minor grooves)
    const rungCount = 28;
    const radius = 1.3;
    const heightSpan = 7.0;
    const turns = 2.67; // 28 / 10.5 = 2.67 helical turns
    const grooveOffset = 2.4; // ~137.5 deg strand offset creating distinct Major and Minor grooves

    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];
    const basePairsSequence = ['AT', 'GC', 'TA', 'CG', 'AT', 'AT', 'GC', 'CG', 'TA', 'GC', 'AT', 'CG', 'TA', 'GC'];

    for (let i = 0; i < rungCount; i++) {
      const frac = i / (rungCount - 1);
      const y = -heightSpan / 2 + frac * heightSpan;
      const angle1 = frac * Math.PI * 2 * turns;
      const angle2 = angle1 + grooveOffset;

      // Separation during uncoil
      const uncoilOffset = uncoilFactor * 1.5;

      // Right-handed helix in Three.js (+Y up): x = r * cos(theta), z = -r * sin(theta)
      const p1 = new THREE.Vector3(
        (radius + uncoilOffset) * Math.cos(angle1),
        y,
        -(radius + uncoilOffset) * Math.sin(angle1)
      );
      const p2 = new THREE.Vector3(
        (radius + uncoilOffset) * Math.cos(angle2),
        y,
        -(radius + uncoilOffset) * Math.sin(angle2)
      );

      strand1Points.push(p1);
      strand2Points.push(p2);

      // Connect with base pair rungs
      const seq = basePairsSequence[i % basePairsSequence.length];
      const isAT = seq === 'AT' || seq === 'TA';
      const isSelected = (isAT && selectedPairId === 'at_pair') || (!isAT && selectedPairId === 'gc_pair');

      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dir1to2 = new THREE.Vector3().subVectors(p2, p1).normalize();
      const halfSpan = p1.distanceTo(midPoint);
      const baseLen = uncoilFactor > 0.1 ? Math.min(halfSpan * 0.85, 0.95) : halfSpan - 0.16;

      const p1Mid = p1.clone().add(dir1to2.clone().multiplyScalar(baseLen / 2));
      const p2Mid = p2.clone().sub(dir1to2.clone().multiplyScalar(baseLen / 2));

      const color1 = seq[0] === 'A' ? 0x10b981 : seq[0] === 'T' ? 0xf59e0b : seq[0] === 'G' ? 0xef4444 : 0x3b82f6;
      const color2 = seq[1] === 'A' ? 0x10b981 : seq[1] === 'T' ? 0xf59e0b : seq[1] === 'G' ? 0xef4444 : 0x3b82f6;

      const rung1Geo = new THREE.CylinderGeometry(0.08, 0.08, baseLen, 12);
      const rung1Mat = new THREE.MeshStandardMaterial({
        color: color1,
        roughness: 0.3,
        emissive: isSelected ? color1 : 0x000000,
        emissiveIntensity: isSelected ? 0.6 : 0,
      });
      const rung1 = new THREE.Mesh(rung1Geo, rung1Mat);
      rung1.position.copy(p1Mid);
      rung1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1to2);
      dnaRoot.add(rung1);

      const rung2Geo = new THREE.CylinderGeometry(0.08, 0.08, baseLen, 12);
      const rung2Mat = new THREE.MeshStandardMaterial({
        color: color2,
        roughness: 0.3,
        emissive: isSelected ? color2 : 0x000000,
        emissiveIntensity: isSelected ? 0.6 : 0,
      });
      const rung2 = new THREE.Mesh(rung2Geo, rung2Mat);
      rung2.position.copy(p2Mid);
      rung2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1to2.clone().negate());
      dnaRoot.add(rung2);

      // Hydrogen bonds: 2 for A=T, 3 for G≡C (hidden when strands unzip)
      if (uncoilFactor < 0.25) {
        const numHBonds = isAT ? 2 : 3;
        const hBondMat = new THREE.MeshBasicMaterial({
          color: isAT ? 0xfef08a : 0x93c5fd,
          transparent: true,
          opacity: 0.85,
        });
        for (let h = 0; h < numHBonds; h++) {
          const offsetY = (h - (numHBonds - 1) / 2) * 0.065;
          const hBondGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.32, 8);
          const hBond = new THREE.Mesh(hBondGeo, hBondMat);
          hBond.position.copy(midPoint).add(new THREE.Vector3(0, offsetY, 0));
          hBond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1to2);
          dnaRoot.add(hBond);
        }
      }
    }

    // Sugar-Phosphate Helical Ribbons (Strand 1 and Strand 2)
    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const tube1Geo = new THREE.TubeGeometry(curve1, 80, 0.12, 16, false);
    const backboneMat = new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, metalness: 0.72, roughness: 0.22, clearcoat: 0.4 });
    const tube1 = new THREE.Mesh(tube1Geo, backboneMat);
    dnaRoot.add(tube1);

    const curve2 = new THREE.CatmullRomCurve3(strand2Points);
    const tube2Geo = new THREE.TubeGeometry(curve2, 80, 0.12, 16, false);
    const tube2 = new THREE.Mesh(tube2Geo, backboneMat);
    dnaRoot.add(tube2);

    // Animation Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (isPlaying && !controls.isPointerDown) {
        dnaRoot.rotation.y += delta * 0.4;
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
      studioEnv.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedPairId, isPlaying, uncoilFactor]);

  const dnaExplanationData: ExplanationData = {
    title: activePair.pairName,
    badge: 'Molecular Genetics',
    subtitle: `Watson-Crick B-DNA Model · Uncoil: ${Math.round(uncoilFactor * 100)}%`,
    whatIsIt: 'Deoxyribonucleic acid (DNA) is the biological macromolecule that stores the genetic code governing all cellular growth and reproduction.',
    howDoesItWork: `Two antiparallel polynucleotide strands twist in a right-handed helix. Complementary hydrogen bonds (${activePair.pairName}) hold opposite nitrogenous bases together at the core.`,
    realLifeExample: 'A digital computer code or architectural blueprint storing all instructions needed to build a complex living machine.',
    whyTitle: 'HOW DO HYDROGEN BONDS STABILIZE THE HELIX?',
    whyExplanation: `${activePair.base1.name} pairs specifically with ${activePair.base2.name} using ${activePair.hydrogenBonds} hydrogen bonds across ${activePair.bondDistance}. ${uncoilFactor > 0.3 ? `Currently uncoiled by ${Math.round(uncoilFactor * 100)}%, simulating replication fork separation by DNA helicase enzyme.` : 'Strands are wound in native B-form conformation.'}`,
    examConnection: 'Chargaff’s Rule: In double-stranded DNA, %Adenine = %Thymine and %Guanine = %Cytosine. G-C pairs have 3 hydrogen bonds and require more thermal energy to denature than A-T pairs (2 H-bonds).',
  };

  return (
    <div className="flex flex-col gap-4">
      <Global3DViewer
        title="3D DNA Double Helix Structure"
        subtitle="Watson-Crick B-DNA Model · 3.4 nm Pitch"
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        showPlayControl={true}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        onResetCamera={() => {
          if (controlsRef.current) {
            controlsRef.current.reset(9.0, 0, Math.PI / 2, new THREE.Vector3(0, 0, 0));
          }
        }}
        onTryIt={onTryIt}
        modelPosition={modelPosition}
        onModelPositionChange={setModelPosition}
        onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
        enablePositionControls={true}
        bottomBarExtras={
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs text-xs font-mono text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>A</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>T</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>G</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>C</span>
            </span>
          </div>
        }
      >
        <div ref={mountRef} className="w-full h-full" />
      </Global3DViewer>

      {/* Educational Explanation Box (Directly below 3D window) */}
      <EducationalExplanationBox data={dnaExplanationData} />

      {/* Base Pair Selector & Helix Parameters */}
      <div id="dna-controls-deck" className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all">
        {/* Base Pair Selector */}
        <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dna className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Complementary Base Pairs
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {DNA_BASE_PAIRS.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => onSelectPair(bp.id)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    bp.id === selectedPairId
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">{bp.pairName}</div>
                  <div className={`text-xs mt-0.5 ${bp.id === selectedPairId ? 'text-slate-300' : 'text-slate-500'}`}>
                    {bp.hydrogenBonds} Hydrogen Bonds · {bp.bondDistance}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Uncoil slider */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Strand Uncoiling / Replication:</span>
              <span className="font-mono text-slate-900 font-semibold">{Math.round(uncoilFactor * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={uncoilFactor}
              onChange={(e) => setUncoilFactor(parseFloat(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Detailed Base Pairing Info */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activePair.pairName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePair.base1.name} ({activePair.base1.ringType}) + {activePair.base2.name} ({activePair.base2.ringType})
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-800">
                {activePair.hydrogenBonds} H-Bonds
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Base-Pairing Mechanism:</span>
                <p>{activePair.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Helical Geometry:</span>
                <p>
                  10 base pairs per helical turn (pitch = 3.4 nm). Diameter = 2.0 nm. Antiparallel orientation with 5' to 3' opposite directionality.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Chargaff's Rule: </span>
              <span>
                In natural double-stranded DNA, the ratio of A:T is 1:1, and the ratio of G:C is 1:1, enforcing complementary base pairing.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
