import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { PendulumParams, PendulumResults, PendulumIntegrator } from '../../simulations/physics/pendulumEngine';
import { Global3DViewer } from '../common/Global3DViewer';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';

interface PendulumSceneProps {
  params: PendulumParams;
  results: PendulumResults;
  onUpdateParams: (newParams: Partial<PendulumParams>) => void;
  onTryIt?: () => void;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
}

export const PendulumScene: React.FC<PendulumSceneProps> = ({
  params,
  results,
  onTryIt,
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const integratorRef = useRef<PendulumIntegrator | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [internalShowLabels, setInternalShowLabels] = useState(true);
  const showLabels = externalShowLabels !== undefined ? externalShowLabels : internalShowLabels;
  const setShowLabels = (val: boolean) => {
    setInternalShowLabels(val);
    if (externalToggleLabels) externalToggleLabels(val);
  };
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const [currentAngleDeg, setCurrentAngleDeg] = useState(params.initialAngle);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pendulumVisualGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (pendulumVisualGroupRef.current) {
      pendulumVisualGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 2,
      maxDistance: 20,
    });
    controls.target.set(0, -params.length / 2, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.38);
    dirLight.position.set(10, 15, 12);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.58);
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    // Floor Grid
    const floorY = -params.length - 1.5;
    const grid = new THREE.GridHelper(20, 20, 0x38bdf8, 0x1e4e58);
    grid.position.y = floorY;
    grid.visible = showGrid;
    styleStudioGridHelper(grid);
    scene.add(grid);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, floorY, {
      stageRadius: 4.8,
    });

    // Axes
    const axes = new THREE.AxesHelper(3);
    axes.visible = showAxes;
    scene.add(axes);

    // Universal Pendulum Position Parent Group
    const pendulumVisualGroup = new THREE.Group();
    pendulumVisualGroup.position.set(modelPosition.x, modelPosition.y, 0);
    pendulumVisualGroupRef.current = pendulumVisualGroup;
    scene.add(pendulumVisualGroup);

    // Stand Architecture (Top beam, upright post, base)
    const standGroup = new THREE.Group();

    // Floor Base plate
    const baseGeo = new THREE.BoxGeometry(2.5, 0.2, 1.5);
    const metalMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.20, clearcoat: 0.35 });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.set(0, -params.length - 1.4, 0);
    standGroup.add(baseMesh);

    // Upright post
    const postHeight = params.length + 1.8;
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, postHeight, 16);
    const postMesh = new THREE.Mesh(postGeo, metalMat);
    postMesh.position.set(-1.0, -params.length - 1.4 + postHeight / 2, 0);
    standGroup.add(postMesh);

    // Top horizontal arm
    const armGeo = new THREE.BoxGeometry(1.4, 0.15, 0.15);
    const armMesh = new THREE.Mesh(armGeo, metalMat);
    armMesh.position.set(-0.4, 0.1, 0);
    standGroup.add(armMesh);

    // Pivot bearing housing
    const pivotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 24);
    const pivotMesh = new THREE.Mesh(pivotGeo, metalMat);
    pivotMesh.rotation.x = Math.PI / 2;
    pivotMesh.position.set(0, 0, 0);
    standGroup.add(pivotMesh);

    // Protractor dial at pivot
    const protractorGeo = new THREE.RingGeometry(0.3, 0.6, 32, 1, -Math.PI / 2 - 1.4, 2.8);
    const protractorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const protractor = new THREE.Mesh(protractorGeo, protractorMat);
    protractor.position.set(0, 0, -0.05);
    protractor.visible = showLabels;
    standGroup.add(protractor);

    pendulumVisualGroup.add(standGroup);

    // Pendulum Group (Rod + Bob, pivoting at origin 0,0,0)
    const pendulumGroup = new THREE.Group();

    // Suspension cord (Cylinder)
    const cordGeo = new THREE.CylinderGeometry(0.02, 0.02, params.length, 16);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.y = -params.length / 2;
    pendulumGroup.add(cord);

    // Polished Brass Bob
    const bobRadius = Math.max(0.15, Math.min(0.5, 0.18 * Math.cbrt(params.mass)));
    const bobGeo = new THREE.SphereGeometry(bobRadius, 32, 32);
    const bobMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // brass amber
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x78350f,
      emissiveIntensity: 0.1,
    });
    const bob = new THREE.Mesh(bobGeo, bobMat);
    bob.position.y = -params.length;
    bob.castShadow = true;
    pendulumGroup.add(bob);

    pendulumVisualGroup.add(pendulumGroup);

    // Trajectory arc
    const arcRadius = params.length;
    const maxRad = (params.initialAngle * Math.PI) / 180;
    const arcCurve = new THREE.EllipseCurve(0, 0, arcRadius, arcRadius, -Math.PI / 2 - maxRad, -Math.PI / 2 + maxRad, false, 0);
    const arcPoints = arcCurve.getPoints(50);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineDashedMaterial({ color: 0x0284c7, dashSize: 0.1, gapSize: 0.05 });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    arcLine.computeLineDistances();
    arcLine.visible = showLabels;
    pendulumVisualGroup.add(arcLine);

    // Initialize numerical integrator
    const integrator = new PendulumIntegrator(params);
    integratorRef.current = integrator;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      controls.update();

      if (isPlaying && integratorRef.current) {
        // Multi-substep physics for extreme numerical stability
        const substeps = 5;
        const subDt = delta / substeps;
        for (let s = 0; s < substeps; s++) {
          integratorRef.current.update(subDt);
        }

        // Apply angular rotation to 3D group
        const theta = integratorRef.current.theta;
        pendulumGroup.rotation.z = theta;

        const deg = (theta * 180) / Math.PI;
        setCurrentAngleDeg(parseFloat(deg.toFixed(1)));

        const linearVelocity = Math.abs(integratorRef.current.omega * params.length);
        setCurrentSpeed(parseFloat(linearVelocity.toFixed(2)));
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
  }, [params, showGrid, showAxes, showLabels, isPlaying]);

  return (
    <Global3DViewer
      title="3D Simple Pendulum"
      subtitle={`L = ${params.length}m · m = ${params.mass}kg · g = ${params.gravity} m/s²`}
      isPlaying={isPlaying}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
      showPlayControl={true}
      showLabels={showLabels}
      onToggleLabels={setShowLabels}
      showGrid={showGrid}
      onToggleGrid={setShowGrid}
      showAxes={showAxes}
      onToggleAxes={setShowAxes}
      onTryIt={onTryIt}
      onResetCamera={() => {
        if (controlsRef.current) {
          controlsRef.current.reset(6, 0, Math.PI / 2, new THREE.Vector3(0, -params.length / 2, 0));
        }
      }}
      onResetSimulation={() => {
        if (integratorRef.current) {
          integratorRef.current.reset(params.initialAngle);
        }
      }}
      modelPosition={modelPosition}
      onModelPositionChange={setModelPosition}
      onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
      positionRange={{ minX: -6, maxX: 6, minY: -5, maxY: 5, step: 0.1 }}
      enablePositionControls={true}
      bottomBarExtras={
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs text-xs font-mono tabular-nums text-slate-700">
          <div>
            <span className="text-slate-400">θ(t): </span>
            <span className="font-semibold text-slate-900">{currentAngleDeg}°</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">v: </span>
            <span className="font-semibold text-slate-900">{currentSpeed} m/s</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">T: </span>
            <span className="font-semibold text-slate-900">{results.period}s</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">f: </span>
            <span className="font-semibold text-slate-900">{results.frequency} Hz</span>
          </div>
        </div>
      }
    >
      <div ref={mountRef} className="w-full h-full" />
    </Global3DViewer>
  );
};
