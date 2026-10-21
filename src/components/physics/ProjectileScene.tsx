import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { ProjectileParams, ProjectileResults, calculateProjectileMotion } from '../../simulations/physics/projectileEngine';
import { Global3DViewer } from '../common/Global3DViewer';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';

interface ProjectileSceneProps {
  params: ProjectileParams;
  results: ProjectileResults;
  onUpdateParams: (newParams: Partial<ProjectileParams>) => void;
  onTryIt?: () => void;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
}

export const ProjectileScene: React.FC<ProjectileSceneProps> = ({
  params,
  results,
  onTryIt,
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Viewer options
  const [internalShowLabels, setInternalShowLabels] = useState(true);
  const showLabels = externalShowLabels !== undefined ? externalShowLabels : internalShowLabels;
  const setShowLabels = (val: boolean) => {
    setInternalShowLabels(val);
    if (externalToggleLabels) externalToggleLabels(val);
  };
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const animProgressRef = useRef(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState(0);
  const [currentSimTime, setCurrentSimTime] = useState(0);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const projectileGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (projectileGroupRef.current) {
      projectileGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean scientific off-white
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 20, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 5,
      maxDistance: 180,
      maxPolarAngle: Math.PI / 2 - 0.02, // Don't go below ground
    });
    controls.target.set(20, 5, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.38);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.58);
    rimLight.position.set(-30, 20, -30);
    scene.add(rimLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, 0, {
      includeStagePlatform: false,
      fogDensity: 0.0038,
    });

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(300, 150);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x13353c,
      roughness: 0.52,
      metalness: 0.22,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Scientific Grid
    const gridHelper = new THREE.GridHelper(160, 32, 0x38bdf8, 0x1e4e58);
    gridHelper.position.set(80, 0.02, 0);
    gridHelper.visible = showGrid;
    styleStudioGridHelper(gridHelper);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(15);
    axesHelper.position.set(0, 0.03, 0);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);

    // Universal Projectile Position Parent Group
    const projectileGroup = new THREE.Group();
    projectileGroup.position.set(modelPosition.x, modelPosition.y, 0);
    projectileGroupRef.current = projectileGroup;
    scene.add(projectileGroup);

    // Launch Cannon / Platform
    const platformGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(2, 2.5, 0.5, 36);
    const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.82, roughness: 0.22, clearcoat: 0.35 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    platformGroup.add(base);

    // Tower if launchHeight > 0
    let tower: THREE.Mesh | null = null;
    if (params.launchHeight > 0) {
      const towerGeo = new THREE.CylinderGeometry(1.2, 1.5, params.launchHeight, 32);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.38, metalness: 0.5 });
      tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = params.launchHeight / 2;
      platformGroup.add(tower);
    }

    // Cannon barrel
    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.65, 4, 32);
    const barrelMat = new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.18, clearcoat: 0.4 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, params.launchHeight + 0.8, 0);
    barrel.rotation.z = -(Math.PI / 2 - (params.angle * Math.PI) / 180);
    platformGroup.add(barrel);
    projectileGroup.add(platformGroup);

    // Trajectory Tube / Line
    const trajectoryPoints = results.trajectory.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    let trajectoryLine: THREE.Line | null = null;
    if (trajectoryPoints.length > 1) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      trajectoryLine = new THREE.Line(lineGeo, lineMat);
      projectileGroup.add(trajectoryLine);
    }

    // Peak apex marker
    const apexPoint = results.trajectory.reduce((max, p) => (p.y > max.y ? p : max), results.trajectory[0] || { x: 0, y: 0, z: 0 });
    const apexGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const apexMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, roughness: 0.3 });
    const apexMarker = new THREE.Mesh(apexGeo, apexMat);
    apexMarker.position.set(apexPoint.x, apexPoint.y, apexPoint.z);
    apexMarker.visible = showLabels;
    projectileGroup.add(apexMarker);

    // Apex dotted ground projection
    const apexDropGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(apexPoint.x, apexPoint.y, apexPoint.z),
      new THREE.Vector3(apexPoint.x, 0, apexPoint.z),
    ]);
    const apexDropMat = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.5, gapSize: 0.3 });
    const apexDropLine = new THREE.Line(apexDropGeo, apexDropMat);
    apexDropLine.computeLineDistances();
    apexDropLine.visible = showLabels;
    projectileGroup.add(apexDropLine);

    // Impact landing marker
    const impactPoint = results.trajectory[results.trajectory.length - 1] || { x: 0, y: 0, z: 0 };
    const impactRingGeo = new THREE.RingGeometry(0.8, 1.2, 32);
    const impactRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const impactRing = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(impactPoint.x, 0.05, impactPoint.z);
    impactRing.visible = showLabels;
    projectileGroup.add(impactRing);

    // Projectile Ball
    const ballRadius = Math.max(0.4, Math.min(1.2, 0.4 * Math.cbrt(params.mass)));
    const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    projectileGroup.add(ball);

    // Animation Loop
    let lastTime = performance.now();
    const trajectory = results.trajectory;

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (trajectory.length > 1 && isPlaying) {
        // Advance animation progress
        const speedMultiplier = 1.0;
        animProgressRef.current += (delta * speedMultiplier) / Math.max(results.flightTime, 0.1);
        if (animProgressRef.current > 1) {
          animProgressRef.current = 0; // Loop flight
        }

        const exactIndex = animProgressRef.current * (trajectory.length - 1);
        const idx = Math.floor(exactIndex);
        const frac = exactIndex - idx;
        const p1 = trajectory[idx] || trajectory[0];
        const p2 = trajectory[Math.min(idx + 1, trajectory.length - 1)] || p1;

        const posX = p1.x + (p2.x - p1.x) * frac;
        const posY = p1.y + (p2.y - p1.y) * frac;
        const posZ = p1.z + (p2.z - p1.z) * frac;

        ball.position.set(posX, Math.max(ballRadius, posY), posZ);

        setCurrentDistance(parseFloat(posX.toFixed(1)));
        setCurrentAltitude(parseFloat(posY.toFixed(1)));
        setCurrentSimTime(parseFloat((animProgressRef.current * results.flightTime).toFixed(2)));
      }

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Resize observer
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
  }, [params, results, showGrid, showAxes, showLabels, isPlaying]);

  return (
    <Global3DViewer
      title="3D Kinematic Ballistics"
      subtitle={`${params.velocity} m/s @ ${params.angle}° · g = ${params.gravity} m/s²`}
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
          controlsRef.current.reset(55, Math.PI / 4, Math.PI / 3, new THREE.Vector3(results.range / 2, 5, 0));
        }
      }}
      onResetSimulation={() => {
        animProgressRef.current = 0;
      }}
      modelPosition={modelPosition}
      onModelPositionChange={setModelPosition}
      onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
      positionRange={{ minX: -50, maxX: 50, minY: -25, maxY: 25, step: 0.5 }}
      enablePositionControls={true}
      bottomBarExtras={
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs text-xs font-mono tabular-nums text-slate-700">
          <div>
            <span className="text-slate-400">t: </span>
            <span className="font-semibold text-slate-900">{currentSimTime}s</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">x: </span>
            <span className="font-semibold text-slate-900">{currentDistance}m</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">y: </span>
            <span className="font-semibold text-slate-900">{currentAltitude}m</span>
          </div>
        </div>
      }
    >
      <div ref={mountRef} className="w-full h-full" />
    </Global3DViewer>
  );
};
