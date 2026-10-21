import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { CircuitParams, CircuitResults } from '../../simulations/physics/circuitEngine';
import { Global3DViewer } from '../common/Global3DViewer';
import { setupPreBatch1StudioEnvironment, styleStudioGridHelper } from '../../simulations/preBatch1VisualUpgradeStudio';

interface CircuitSceneProps {
  params: CircuitParams;
  results: CircuitResults;
  onUpdateParams: (newParams: Partial<CircuitParams>) => void;
  onTryIt?: () => void;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
}

export const CircuitScene: React.FC<CircuitSceneProps> = ({
  params,
  results,
  onUpdateParams,
  onTryIt,
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
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
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const circuitVisualRootRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (circuitVisualRootRef.current) {
      circuitVisualRootRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  // Wire loop waypoint coordinates from Negative terminal (-2.7, -3) around external circuit to Positive terminal (-1.3, -3)
  const waypoints = [
    new THREE.Vector3(-2.7, 0.1, -3), // Battery negative terminal lead
    new THREE.Vector3(-4, 0.1, -3),   // Top-left corner
    new THREE.Vector3(-4, 0.1, 0),    // Knife switch
    new THREE.Vector3(-4, 0.1, 3),    // Bottom-left corner
    new THREE.Vector3(0, 0.1, 3),     // Resistor
    new THREE.Vector3(4, 0.1, 3),     // Bottom-right corner
    new THREE.Vector3(4, 0.1, 0),     // Light Bulb
    new THREE.Vector3(4, 0.1, -3),    // Top-right corner
    new THREE.Vector3(-1.3, 0.1, -3), // Battery positive terminal lead
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 9, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 5,
      maxDistance: 25,
      maxPolarAngle: Math.PI / 2 - 0.05,
    });
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    // Key directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.38);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const studioEnv = setupPreBatch1StudioEnvironment(scene, renderer, -0.35, {
      stageRadius: 7.4,
    });

    // Universal Circuit Position Parent Group
    const circuitVisualRoot = new THREE.Group();
    circuitVisualRoot.position.set(modelPosition.x, modelPosition.y, 0);
    circuitVisualRootRef.current = circuitVisualRoot;
    scene.add(circuitVisualRoot);

    // Laboratory Breadboard base
    const boardGeo = new THREE.BoxGeometry(11, 0.3, 9);
    const boardMat = new THREE.MeshPhysicalMaterial({ color: 0x1e3a4c, roughness: 0.36, metalness: 0.25, clearcoat: 0.25 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -0.15;
    board.receiveShadow = true;
    circuitVisualRoot.add(board);

    // Grid on breadboard
    const grid = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e4e58);
    grid.position.y = 0.01;
    grid.visible = showGrid;
    styleStudioGridHelper(grid);
    circuitVisualRoot.add(grid);

    // Axes
    const axes = new THREE.AxesHelper(3);
    axes.position.set(-5, 0.02, -4);
    axes.visible = showAxes;
    scene.add(axes);

    // 1. DC Power Supply (Battery Pack)
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-2, 0.1, -3);

    const battBodyGeo = new THREE.BoxGeometry(2.4, 1.2, 1.4);
    const battBodyMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, roughness: 0.24, metalness: 0.65, clearcoat: 0.3 });
    const battBody = new THREE.Mesh(battBodyGeo, battBodyMat);
    battBody.position.y = 0.6;
    battBody.castShadow = true;
    batteryGroup.add(battBody);

    // Battery terminals (+ red, - blue/black)
    const termPosGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16);
    const termPosMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
    const termPos = new THREE.Mesh(termPosGeo, termPosMat);
    termPos.position.set(0.7, 1.3, 0);
    batteryGroup.add(termPos);

    const termNegMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const termNeg = new THREE.Mesh(termPosGeo, termNegMat);
    termNeg.position.set(-0.7, 1.3, 0);
    batteryGroup.add(termNeg);

    circuitVisualRoot.add(batteryGroup);

    // 2. Knife Switch Component
    const switchGroup = new THREE.Group();
    switchGroup.position.set(-4, 0.1, 0);

    const switchBaseGeo = new THREE.BoxGeometry(1.2, 0.15, 2.0);
    const switchBaseMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 }); // bakelite
    const switchBase = new THREE.Mesh(switchBaseGeo, switchBaseMat);
    switchBase.position.y = 0.08;
    switchGroup.add(switchBase);

    // Switch Blade (Brass arm hinged at rear pivot z = -0.6 so it rotates up from hinge when open)
    const bladeGeo = new THREE.BoxGeometry(0.1, 0.08, 1.4);
    bladeGeo.translate(0, 0, 0.7);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
    const bladeMesh = new THREE.Mesh(bladeGeo, brassMat);
    bladeMesh.position.set(0, 0.22, -0.6);
    bladeMesh.rotation.x = params.switchClosed ? 0 : -Math.PI / 5;
    switchGroup.add(bladeMesh);

    // Insulated handle at the free end of the blade
    const handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.08, 1.45);
    handle.rotation.x = Math.PI / 2;
    bladeMesh.add(handle);

    circuitVisualRoot.add(switchGroup);

    // 3. Resistor Component (Cylinder with color stripes)
    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(0, 0.1, 3);

    const resBodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 24);
    resBodyGeo.rotateZ(Math.PI / 2);
    const resBodyMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.5 }); // beige ceramic
    const resBody = new THREE.Mesh(resBodyGeo, resBodyMat);
    resBody.position.y = 0.35;
    resBody.castShadow = true;
    resistorGroup.add(resBody);

    // Color bands (Brown, Black, Gold)
    const bandMat = new THREE.MeshBasicMaterial({ color: 0xb45309 });
    const bandGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.12, 24);
    bandGeo.rotateZ(Math.PI / 2);
    const b1 = new THREE.Mesh(bandGeo, bandMat);
    b1.position.set(-0.4, 0.35, 0);
    resistorGroup.add(b1);

    circuitVisualRoot.add(resistorGroup);

    // 4. Incandescent Light Bulb Assembly
    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(4, 0.1, 0);

    // Ceramic socket base
    const socketGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 32);
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.y = 0.25;
    bulbGroup.add(socket);

    // Glass Bulb Sphere
    const glassGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const bulbGlow = params.switchClosed && results.bulbBrightnessPercent > 0;
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: bulbGlow ? 0xfef08a : 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      emissive: bulbGlow ? 0xfbbf24 : 0x000000,
      emissiveIntensity: (results.bulbBrightnessPercent / 100) * 0.8,
    });
    const glassBulb = new THREE.Mesh(glassGeo, glassMat);
    glassBulb.position.y = 1.1;
    bulbGroup.add(glassBulb);

    // Tungsten Filament Coil
    const filamentGeo = new THREE.TorusGeometry(0.2, 0.03, 16, 32, Math.PI);
    const filamentMat = new THREE.MeshStandardMaterial({
      color: bulbGlow ? 0xffffff : 0x475569,
      emissive: bulbGlow ? 0xf97316 : 0x000000,
      emissiveIntensity: bulbGlow ? (results.bulbBrightnessPercent / 100) * 2.5 : 0,
    });
    const filament = new THREE.Mesh(filamentGeo, filamentMat);
    filament.position.set(0, 1.0, 0);
    filament.rotation.x = Math.PI / 2;
    bulbGroup.add(filament);

    // Dynamic Point Light when bulb is illuminated
    let bulbLight: THREE.PointLight | null = null;
    if (bulbGlow) {
      bulbLight = new THREE.PointLight(0xfef08a, (results.bulbBrightnessPercent / 100) * 3, 15);
      bulbLight.position.set(4, 1.2, 0);
      bulbLight.castShadow = true;
      circuitVisualRoot.add(bulbLight);
    }

    circuitVisualRoot.add(bulbGroup);

    // 5. Copper Circuit Wires (open path between negative and positive battery terminals, not shorting through battery)
    const wirePath = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      wirePath.add(new THREE.LineCurve3(p1, p2));
    }

    const wireTubeGeo = new THREE.TubeGeometry(wirePath, 120, 0.05, 12, false);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 }); // shiny copper
    const wireMesh = new THREE.Mesh(wireTubeGeo, wireMat);
    circuitVisualRoot.add(wireMesh);

    // 6. Electron Charge Flowing Particles
    const particleCount = 48;
    const particleGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // electric cyan
    const particleGroup = new THREE.Group();
    const particleProgress: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      particleGroup.add(p);
      particleProgress.push(i / particleCount);
    }
    particleGroup.visible = params.switchClosed && results.current > 0;
    circuitVisualRoot.add(particleGroup);

    // Click Detection for Knife Switch
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([switchBase, bladeMesh], true);
      if (intersects.length > 0) {
        onUpdateParams({ switchClosed: !params.switchClosed });
      }
    };
    renderer.domElement.addEventListener('click', handlePointerDown);

    // Animation Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      // Animate flowing electrons if switch is closed
      if (params.switchClosed && isPlaying && results.current > 0) {
        const driftSpeed = 0.15 * Math.min(results.current, 5); // scales with I = V/R
        for (let i = 0; i < particleCount; i++) {
          particleProgress[i] = (particleProgress[i] + delta * driftSpeed) % 1;
          const pt = wirePath.getPointAt(particleProgress[i]);
          const mesh = particleGroup.children[i];
          if (mesh) {
            mesh.position.set(pt.x, pt.y + 0.04, pt.z);
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
      renderer.domElement.removeEventListener('click', handlePointerDown);
      studioEnv.dispose();
      controls.dispose();
      renderer.dispose();
      if (bulbLight) scene.remove(bulbLight);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [params, results, showGrid, showAxes, showLabels, isPlaying]);

  return (
    <Global3DViewer
      title="3D Direct Current Circuit"
      subtitle={`V = ${params.voltage}V · R = ${params.resistance}Ω · I = ${results.current}A`}
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
          controlsRef.current.reset(14, 0, Math.PI / 3, new THREE.Vector3(0, 0, 0));
        }
      }}
      onResetSimulation={() => {
        onUpdateParams({ switchClosed: true });
      }}
      modelPosition={modelPosition}
      onModelPositionChange={setModelPosition}
      onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
      positionRange={{ minX: -8, maxX: 8, minY: -6, maxY: 6, step: 0.2 }}
      enablePositionControls={true}
      bottomBarExtras={
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs text-xs font-mono tabular-nums text-slate-700">
          <div>
            <span className="text-slate-400">Current I: </span>
            <span className="font-semibold text-slate-900">{results.current} A</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">Power P: </span>
            <span className="font-semibold text-slate-900">{results.power} W</span>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <span className="text-slate-400">Bulb: </span>
            <span className={`font-semibold ${results.bulbBrightnessPercent > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {results.bulbBrightnessPercent}% Glow
            </span>
          </div>
        </div>
      }
    >
      <div ref={mountRef} className="w-full h-full" />
    </Global3DViewer>
  );
};
