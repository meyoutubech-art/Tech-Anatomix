import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { HEART_STRUCTURES } from '../../data/biologyData';
import { HeartStructureInfo } from '../../types/biology';
import { Global3DViewer } from '../common/Global3DViewer';
import { EducationalExplanationBox, ExplanationData } from '../common/EducationalExplanationBox';
import { Activity, Heart, Droplets, Info } from 'lucide-react';
import { setupPreBatch1StudioEnvironment } from '../../simulations/preBatch1VisualUpgradeStudio';

interface HeartSceneProps {
  selectedStructureId: string;
  onSelectStructure: (id: string) => void;
  onTryIt?: () => void;
}

export const HeartScene: React.FC<HeartSceneProps> = ({ selectedStructureId, onSelectStructure, onTryIt }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [bpm, setBpm] = useState(72);

  const structure = HEART_STRUCTURES.find((s) => s.id === selectedStructureId) || HEART_STRUCTURES[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.0, 7.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 3,
      maxDistance: 15,
    });
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.38);
    keyLight.position.set(8, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfca5a5, 0.58);
    fillLight.position.set(-8, -4, -6);
    scene.add(fillLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -2.15, {
      stageRadius: 4.2,
    });

    const heartRoot = new THREE.Group();
    scene.add(heartRoot);

    const interactiveMeshes: { mesh: THREE.Object3D; id: string }[] = [];

    // 1. Left Ventricle (Thick muscular apex left-hand side)
    const isLvSelected = selectedStructureId === 'left_ventricle';
    const lvGeo = new THREE.ConeGeometry(1.2, 2.2, 32);
    lvGeo.rotateZ(Math.PI);
    const lvMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // deep red
      roughness: 0.35,
      emissive: isLvSelected ? 0xef4444 : 0x000000,
      emissiveIntensity: isLvSelected ? 0.4 : 0,
    });
    const leftVentricle = new THREE.Mesh(lvGeo, lvMat);
    leftVentricle.position.set(0.5, -0.6, 0);
    leftVentricle.rotation.z = 0.25;
    heartRoot.add(leftVentricle);
    interactiveMeshes.push({ mesh: leftVentricle, id: 'left_ventricle' });

    // 2. Right Ventricle (Anterior wall right-hand side)
    const isRvSelected = selectedStructureId === 'right_ventricle';
    const rvGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const rvMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      emissive: isRvSelected ? 0x3b82f6 : 0x000000,
      emissiveIntensity: isRvSelected ? 0.4 : 0,
    });
    const rightVentricle = new THREE.Mesh(rvGeo, rvMat);
    rightVentricle.position.set(-0.7, -0.3, 0.3);
    rightVentricle.scale.set(0.9, 1.4, 0.7);
    heartRoot.add(rightVentricle);
    interactiveMeshes.push({ mesh: rightVentricle, id: 'right_ventricle' });

    // 3. Atria (Right & Left top auricles)
    const isAtriaSelected = selectedStructureId === 'atria';
    const atriaMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.45,
      emissive: isAtriaSelected ? 0xf59e0b : 0x000000,
      emissiveIntensity: isAtriaSelected ? 0.4 : 0,
    });
    const raMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), atriaMat);
    raMesh.position.set(-1.0, 0.9, 0);
    heartRoot.add(raMesh);

    const laMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), atriaMat);
    laMesh.position.set(0.8, 0.9, -0.2);
    heartRoot.add(laMesh);
    interactiveMeshes.push({ mesh: raMesh, id: 'atria' });
    interactiveMeshes.push({ mesh: laMesh, id: 'atria' });

    // 4. Aorta (Main curved systemic arch)
    const isAortaSelected = selectedStructureId === 'aorta';
    const aortaCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.1, 0.8, 0),
      new THREE.Vector3(0.0, 2.2, -0.2),
      new THREE.Vector3(-1.2, 1.4, -0.4)
    );
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.38, 16, false);
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // oxygenated crimson
      roughness: 0.25,
      emissive: isAortaSelected ? 0xff0000 : 0x000000,
      emissiveIntensity: isAortaSelected ? 0.5 : 0,
    });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    heartRoot.add(aortaMesh);
    interactiveMeshes.push({ mesh: aortaMesh, id: 'aorta' });

    // 3 branch arteries off aortic arch (Brachiocephalic, Carotid, Subclavian)
    for (let i = 0; i < 3; i++) {
      const branchGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 12);
      const branch = new THREE.Mesh(branchGeo, aortaMat);
      branch.position.set(-0.2 - i * 0.3, 1.9, -0.2);
      branch.rotation.z = -0.15;
      heartRoot.add(branch);
    }

    // 5. Pulmonary Artery / Trunk (Crosses in front of aorta toward lungs)
    const isPaSelected = selectedStructureId === 'pulmonary_artery';
    const paCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.4, 0.6, 0.4),
      new THREE.Vector3(0.2, 1.4, 0.3),
      new THREE.Vector3(1.2, 1.3, -0.2)
    );
    const paGeo = new THREE.TubeGeometry(paCurve, 24, 0.32, 16, false);
    const paMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // deoxygenated royal blue
      roughness: 0.3,
      emissive: isPaSelected ? 0x60a5fa : 0x000000,
      emissiveIntensity: isPaSelected ? 0.5 : 0,
    });
    const paMesh = new THREE.Mesh(paGeo, paMat);
    heartRoot.add(paMesh);
    interactiveMeshes.push({ mesh: paMesh, id: 'pulmonary_artery' });

    // 6. Blood Flow Particles (Pulsing blue particles for deoxygenated, red for oxygenated)
    const particleCount = 36;
    const bloodParticlesGroup = new THREE.Group();
    const particleProgress: number[] = [];

    const oxyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const deoxyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pGeo = new THREE.SphereGeometry(0.06, 8, 8);

    for (let i = 0; i < particleCount; i++) {
      const isOxy = i % 2 === 0;
      const p = new THREE.Mesh(pGeo, isOxy ? oxyMat : deoxyMat);
      bloodParticlesGroup.add(p);
      particleProgress.push(i / particleCount);
    }
    heartRoot.add(bloodParticlesGroup);

    // Raycast Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const candidateMeshes = interactiveMeshes.map((item) => item.mesh);
      const intersects = raycaster.intersectObjects(candidateMeshes, false);
      if (intersects.length > 0) {
        const found = interactiveMeshes.find((item) => item.mesh === intersects[0].object);
        if (found) {
          onSelectStructure(found.id);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Cardiac Pumping Loop
    let lastTime = performance.now();
    let heartPhase = 0;

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (isPlaying) {
        // Heartbeat frequency f = bpm / 60
        const cardiacFreq = (bpm / 60) * Math.PI * 2;
        heartPhase += delta * cardiacFreq;

        // Cardiac systole contraction / diastole relaxation
        const beatScale = 1.0 + 0.06 * Math.sin(heartPhase) * Math.pow(Math.sin(heartPhase), 4);
        heartRoot.scale.set(beatScale, beatScale * 0.98, beatScale);

        // Animate blood particles along curves
        for (let i = 0; i < particleCount; i++) {
          particleProgress[i] = (particleProgress[i] + delta * 0.4) % 1;
          const curve = i % 2 === 0 ? aortaCurve : paCurve;
          const pt = curve.getPointAt(particleProgress[i]);
          const p = bloodParticlesGroup.children[i];
          if (p) {
            p.position.copy(pt);
          }
        }
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
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      studioEnv.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedStructureId, isPlaying, bpm]);

  const heartExplanationData: ExplanationData = {
    title: structure.name,
    badge: structure.bloodType === 'oxygenated' ? 'Oxygen-Rich (Systemic)' : 'Deoxygenated (Pulmonary)',
    subtitle: `Cardiac Chamber/Vessel · ${bpm} BPM`,
    whatIsIt: 'A specialized muscular chamber or major blood vessel in the four-chambered human heart.',
    whatDoesItDo: structure.role,
    realLifeExample: 'The heart works like a pump that continuously moves blood through the body.',
    whyTitle: 'HOW DOES BLOOD FLOW THROUGH THIS CHAMBER?',
    whyExplanation: `Transports ${structure.bloodType} blood under rhythmic muscular contractions. At ${bpm} BPM, each complete heartbeat cycle takes ${(60 / bpm).toFixed(2)} seconds. ${structure.pressures ? `Operating pressure: ${structure.pressures}.` : ''}`,
    examConnection: `${structure.clinicalNote} Double Circulation: Pulmonary circuit pumps to lungs, systemic circuit pumps across the body.`,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sketchfab 3D Interactive Embed for Labelled Realistic Heart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              Interactive 3D Anatomical Model
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Labelled 3D Animated Realistic Heart
            </h2>
            <p className="text-xs text-slate-500">
              Cardiovascular Hemodynamics, 4 Chambers & Valvular Mechanics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              3D Interactive View
            </span>
          </div>
        </div>

        <div className="sketchfab-embed-wrapper w-full relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-950">
          {/* TOP EXTREME LEFT: Tech-Anatomix Logo */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <img
              src="/logo.png"
              alt="Tech-Anatomix Logo"
              className="w-9 h-9 object-contain rounded-lg shadow-md drop-shadow bg-slate-900/60 p-1 backdrop-blur-xs border border-white/15"
            />
          </div>
          <iframe
            title="Labelled 3d Animated Realistic Heart"
            frameBorder="0"
            allowFullScreen
            // @ts-ignore
            mozallowfullscreen="true"
            webkitallowfullscreen="true"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            // @ts-ignore
            xr-spatial-tracking="true"
            execution-while-out-of-viewport="true"
            execution-while-not-rendered="true"
            web-share="true"
            src="https://sketchfab.com/models/cc339417fcd745afafaa01623405b69a/embed?autostart=1"
            className="w-full h-[520px] sm:h-[580px] lg:h-[640px] border-0 block"
          />
        </div>
      </div>

      {/* Educational Explanation Box (Directly below 3D window) */}
      <EducationalExplanationBox data={heartExplanationData} />

      {/* Anatomy Structure Selector & Info Panel */}
      <div id="heart-controls-panel" className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all">
        {/* Selector Tabs */}
        <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Cardiac Chambers & Vessels
            </h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {HEART_STRUCTURES.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectStructure(s.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                  s.id === selectedStructureId
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
                }`}
              >
                <span>{s.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                    s.bloodType === 'oxygenated'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {s.bloodType === 'oxygenated' ? 'O₂ Rich' : 'Deoxy'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Medical Information */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{structure.name}</h3>
                {structure.pressures && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{structure.pressures}</p>
                )}
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                  structure.bloodType === 'oxygenated'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : 'bg-sky-50 text-sky-700 border border-sky-200/60'
                }`}
              >
                {structure.bloodType} blood
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Circulatory Role:</span>
                <p>{structure.role}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-0.5">Hemodynamics & Pressures:</span>
                <p>{structure.pressures || 'Continuous low-resistance capacitance vascular channel.'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Clinical Significance: </span>
              <span>{structure.clinicalNote}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
