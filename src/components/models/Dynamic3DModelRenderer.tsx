import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../../simulations/orbitControls';
import { ScientificModelSpec, ModelPartSpec } from '../../types/aiModel';
import { Global3DViewer } from '../common/Global3DViewer';
import { PositionRange } from '../common/ModelPositionControls';
import { ExternalCalloutOverlay, ExternalCalloutItem } from '../common/ExternalCalloutOverlay';
import { EducationalExplanationBox } from '../common/EducationalExplanationBox';
import { getComponentDisplayName } from '../../utils/componentDisplayName';
import { ModelAwareChatbot } from '../ai/ModelAwareChatbot';
import { Sliders, Sparkles, Tag, Check, Eye, HelpCircle, FileSpreadsheet, Flame, RotateCcw, Play, Pause, Waves, Wind, Bell, Volume2, Zap, Power, Heart, Activity, ChevronDown, ChevronUp, Settings, Grid, Compass, Box, Layers, Gauge } from 'lucide-react';
import { PresentationExportModal } from '../common/PresentationExportModal';
import { PresentationExportOptions } from '../../utils/presentationGenerator';
import { ExternalModelWorkspace } from './ExternalModelWorkspace';
import { buildScientificConceptSpecification } from '../../utils/proceduralModelSynthesizer';
import {
  HEAT_MATERIALS,
  ConductionState,
  createConductionState,
  stepConduction,
  ConvectionMetrics,
  calculateConvectionMetrics,
  RadiationMetrics,
  calculateRadiationMetrics,
  getTemperatureHexColor,
  getTemperatureColorRgb,
} from '../../simulations/physics/heatTransferEngine';
import {
  createInitialBellState,
  stepElectricBell,
  ElectricBellState,
  ElectricBellParams,
  BellCyclePhase,
} from '../../simulations/physics/electricBellEngine';
import {
  calculateEmWaveMetrics,
  calculatePlasmaMetrics,
  calculateAcceleratorMetrics,
  calculateMaglevMetrics,
  calculateSuperconductorMetrics,
  calculateBlackHoleLensingMetrics,
  calculateQuantumTunnellingMetrics,
} from '../../simulations/physics/advancedPhysicsBatch1Engine';
import {
  isAdvancedPhysicsBatch1Model,
  setupBatch1StudioEnvironment,
  buildBatch1CustomAssemblies,
  updateBatch1CustomAssemblies,
  Batch1SceneHandles,
} from '../../simulations/physics/advancedPhysicsBatch1Studio';
import {
  calculateFaradayInductionMetrics,
  calculateMotorGeneratorMetrics,
  calculateTransformerCouplingMetrics,
  calculateWaveInterferenceMetrics,
  calculateInterferometerMetrics,
  calculateFluidDynamicsMetrics,
  calculateTokamakFusionMetrics,
} from '../../simulations/physics/advancedPhysicsBatch2Engine';
import {
  isAdvancedPhysicsBatch2Model,
  buildBatch2CustomAssemblies,
  updateBatch2CustomAssemblies,
  Batch2SceneHandles,
} from '../../simulations/physics/advancedPhysicsBatch2Studio';
import {
  calculateDopplerSonicBoomMetrics,
  calculateSeismicWavesMetrics,
  calculateGyroscopeMetrics,
  calculateShmCoupledMetrics,
  calculateCarnotEngineMetrics,
  calculatePhotoelectricMetrics,
  calculateSpecialRelativityMetrics,
} from '../../simulations/physics/advancedPhysicsBatch3Engine';
import {
  isAdvancedPhysicsBatch3Model,
  buildBatch3CustomAssemblies,
  updateBatch3CustomAssemblies,
  Batch3SceneHandles,
} from '../../simulations/physics/advancedPhysicsBatch3Studio';
import {
  calculateMaxwellEquationsMetrics,
  calculateAcRlcCircuitMetrics,
  calculateThinLensOpticsMetrics,
  calculateDopplerUltrasoundMetrics,
  calculateEarthMagnetosphereMetrics,
  calculateSemiconductorPnJunctionMetrics,
  calculateRadioactiveDecayMetrics,
} from '../../simulations/physics/advancedPhysicsBatch4Engine';
import {
  isAdvancedPhysicsBatch4Model,
  buildBatch4CustomAssemblies,
  updateBatch4CustomAssemblies,
  Batch4SceneHandles,
} from '../../simulations/physics/advancedPhysicsBatch4Studio';
import {
  calculateMolecularOrbitalMetrics,
  calculateAtomicOrbitalMetrics,
  calculateCrystalLatticeMetrics,
  calculateMolecularPolarityMetrics,
  calculateIntermolecularForcesMetrics,
  calculateElectrochemicalCellMetrics,
  calculateElectrolysisMetrics,
} from '../../simulations/chemistry/chemistryBatch1Engine';
import {
  isChemistryBatch1Model,
  buildChemistryBatch1CustomAssemblies,
  updateChemistryBatch1CustomAssemblies,
  ChemistryBatch1SceneHandles,
} from '../../simulations/chemistry/chemistryBatch1Studio';
import {
  calculateChemicalKineticsMetrics,
  calculateChemicalEquilibriumMetrics,
  calculateReactionEnergyProfileMetrics,
  calculateCatalysisMetrics,
  calculateTitrationMetrics,
  calculateSolubilityPrecipitationMetrics,
  calculateBufferSolutionMetrics,
} from '../../simulations/chemistry/chemistryBatch2Engine';
import {
  isChemistryBatch2Model,
  buildChemistryBatch2CustomAssemblies,
  updateChemistryBatch2CustomAssemblies,
  ChemistryBatch2SceneHandles,
} from '../../simulations/chemistry/chemistryBatch2Studio';
import {
  isPreBatch1Model,
  setupPreBatch1StudioEnvironment,
  styleStudioGridHelper,
  createPreBatch1UpgradedMaterial,
  createPreBatch1UpgradedGeometry,
  enhancePreBatch1ModelAssemblies,
} from '../../simulations/preBatch1VisualUpgradeStudio';
import { soundEngine } from '../../utils/soundEngine';



export interface InitialModelStateSnapshot {
  modelId: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraUp: [number, number, number];
  cameraFov: number;
  cameraZoom: number;
  parameters: Record<string, number>;
  conditions: Record<string, any>;
  modelPosition: { x: number; y: number };
  isPlaying: boolean;
  isExplodedView: boolean;
  selectedPartId: string | null;
  partTransforms: Record<
    string,
    {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
      visible: boolean;
    }
  >;
}

/**
 * Captures the complete initial state snapshot for any loaded 3D model specification.
 */
export function captureInitialModelStateSnapshot(
  modelSpec: ScientificModelSpec
): InitialModelStateSnapshot {
  const defaultParams: Record<string, number> = {};
  Object.values(modelSpec.parameters || {}).forEach((p) => {
    defaultParams[p.id] = p.defaultValue;
  });

  const defaultConds: Record<string, any> = {};
  Object.values(modelSpec.conditions || {}).forEach((c) => {
    defaultConds[c.id] = c.defaultValue;
  });

  const partTransforms: InitialModelStateSnapshot['partTransforms'] = {};
  (modelSpec.parts || []).forEach((part) => {
    partTransforms[part.id] = {
      position: [
        part.position?.[0] ?? 0,
        part.position?.[1] ?? 0,
        part.position?.[2] ?? 0,
      ],
      rotation: [
        part.rotation?.[0] ?? 0,
        part.rotation?.[1] ?? 0,
        part.rotation?.[2] ?? 0,
      ],
      scale: [
        part.scale?.[0] ?? 1,
        part.scale?.[1] ?? 1,
        part.scale?.[2] ?? 1,
      ],
      visible: true,
    };
  });

  const camPos = modelSpec.camera?.position || [0, 4, 8];
  const camTarget = modelSpec.camera?.target || [0, 0, 0];

  return {
    modelId: modelSpec.id,
    cameraPosition: [camPos[0], camPos[1], camPos[2]],
    cameraTarget: [camTarget[0], camTarget[1], camTarget[2]],
    cameraUp: [0, 1, 0],
    cameraFov: 40,
    cameraZoom: 1,
    parameters: defaultParams,
    conditions: defaultConds,
    modelPosition: { x: 0, y: 0 },
    isPlaying: true,
    isExplodedView: false,
    selectedPartId: null,
    partTransforms,
  };
}

interface Dynamic3DModelRendererProps {
  modelSpec: ScientificModelSpec;
  parameters?: Record<string, number>;
  conditions?: Record<string, any>;
  selectedPartId?: string | null;
  onSelectPart?: (part: ModelPartSpec | null) => void;
  onUpdateParameter?: (paramId: string, value: number) => void;
  onUpdateCondition?: (condId: string, value: any) => void;
  onResetAll?: (defaultParams: Record<string, number>, defaultConditions: Record<string, any>) => void;
  onTryIt?: () => void;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
}

interface RutherfordParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scattered: boolean;
  active: boolean;
  age: number;
  channel: number;
  pathType: 'straight' | 'small' | 'moderate' | 'backscatter';
}

interface ScintillationFlash {
  position: THREE.Vector3;
  life: number;
}

export const Dynamic3DModelRenderer: React.FC<Dynamic3DModelRendererProps> = ({
  modelSpec,
  parameters: externalParameters,
  conditions: externalConditions,
  selectedPartId,
  onSelectPart,
  onUpdateParameter,
  onUpdateCondition,
  onResetAll,
  onTryIt,
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resetSimTriggerRef = useRef<number>(0);
  const initialSnapshotRef = useRef<InitialModelStateSnapshot>(
    captureInitialModelStateSnapshot(modelSpec)
  );

  // Fallback state if parameters or conditions are not passed from parent
  const [internalParameters, setInternalParameters] = useState<Record<string, number>>(() => {
    return { ...initialSnapshotRef.current.parameters };
  });

  const [internalConditions, setInternalConditions] = useState<Record<string, any>>(() => {
    return { ...initialSnapshotRef.current.conditions };
  });

  const parameters = externalParameters || internalParameters;
  const conditions = externalConditions || internalConditions;

  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;
  const conditionsRef = useRef(conditions);
  conditionsRef.current = conditions;

  // Label visibility state (default: true)
  const [internalShowLabels, setInternalShowLabels] = useState(true);
  const showLabels = externalShowLabels !== undefined ? externalShowLabels : internalShowLabels;
  const setShowLabels = (val: boolean) => {
    setInternalShowLabels(val);
    if (externalToggleLabels) {
      externalToggleLabels(val);
    }
  };

  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExplorePartsActive, setIsExplorePartsActive] = useState(true);
  const [inspectedPart, setInspectedPart] = useState<ModelPartSpec | null>(null);
  const [isExplodedView, setIsExplodedView] = useState(false);
  const [lastParamWhy, setLastParamWhy] = useState<{ title: string; observation: string; why: string } | null>(null);
  const [isBellInfoExpanded, setIsBellInfoExpanded] = useState(true);
  const [isBondingInfoExpanded, setIsBondingInfoExpanded] = useState(true);

  // Universal 3D Model Position Controller state
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionGroupRef = useRef<THREE.Group | null>(null);

  // Capture fresh initial snapshot and reset position when model changes
  useEffect(() => {
    soundEngine.stopSource('dynamic-3d-renderer');
    const snap = captureInitialModelStateSnapshot(modelSpec);
    initialSnapshotRef.current = snap;
    setInternalParameters({ ...snap.parameters });
    setInternalConditions({ ...snap.conditions });
    setModelPosition({ x: 0, y: 0 });
    setInspectedPart(null);
    setIsExplodedView(false);
    setIsPlaying(true);
    setLastParamWhy(null);
  }, [modelSpec.id]);

  // Synchronize state-driven simulation audio with active 3D model, parameters, conditions, and play/pause state
  useEffect(() => {
    soundEngine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec,
      isPlaying,
      parameters,
      conditions,
    });
  }, [modelSpec, isPlaying, parameters, conditions]);

  useEffect(() => {
    return () => {
      soundEngine.stopSource('dynamic-3d-renderer');
    };
  }, []);

  // Synchronize translation smoothly without recreating WebGL context
  useEffect(() => {
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0);
    }
  }, [modelPosition]);

  // Scale-aware position limits tailored to model camera bounds
  const positionRange = useMemo<PositionRange>(() => {
    const camPos = modelSpec.camera?.position || [0, 4, 8];
    const camDist = Math.sqrt(camPos[0] ** 2 + camPos[1] ** 2 + camPos[2] ** 2);
    const halfSpan = Math.max(3.0, +(camDist * 0.45).toFixed(1));
    const step = Math.max(0.05, +(halfSpan / 50).toFixed(2));
    return {
      minX: -halfSpan,
      maxX: halfSpan,
      minY: -Math.round(halfSpan * 0.8),
      maxY: Math.round(halfSpan * 0.8),
      step,
    };
  }, [modelSpec]);

  // Check if model is the Human Heart Explorer or has heart embed
  const isHeartModel =
    modelSpec.id !== 'blood-transport' &&
    modelSpec.functionalType !== 'blood-transport' &&
    (modelSpec.id === 'heart-explorer' ||
      modelSpec.id === 'human-heart' ||
      modelSpec.functionalType === 'heart-explorer' ||
      modelSpec.functionalType === 'human-heart' ||
      (modelSpec.title && modelSpec.title.toLowerCase().includes('heart')));

  // Check if model is the Human Respiratory System or has respiratory embed
  const isRespiratoryModel =
    modelSpec.id === 'respiratory-explorer' ||
    modelSpec.id === 'respiratory-system' ||
    modelSpec.functionalType === 'respiratory-explorer' ||
    modelSpec.functionalType === 'respiratory-system' ||
    (modelSpec.title && modelSpec.title.toLowerCase().includes('respiratory'));

  // Check if model is the Human Digestive System or has digestive embed
  const isDigestiveModel =
    modelSpec.id === 'digestive-system' ||
    modelSpec.id === 'digestive-explorer' ||
    modelSpec.id === 'human-digestive-system' ||
    modelSpec.functionalType === 'digestive-system' ||
    (modelSpec.title && modelSpec.title.toLowerCase().includes('digestive'));

  // Check if model is the Human Brain Explorer or has brain embed
  const isBrainModel =
    modelSpec.id === 'brain-explorer' ||
    modelSpec.id === 'human-brain-explorer' ||
    modelSpec.id === 'human-brain' ||
    modelSpec.functionalType === 'brain-explorer' ||
    (modelSpec.title && modelSpec.title.toLowerCase().includes('brain'));

  const isCustomEmbedModel = isHeartModel || isRespiratoryModel || isDigestiveModel || isBrainModel || Boolean(modelSpec.embedHtml);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const isExplorePartsActiveRef = useRef(isExplorePartsActive);
  useEffect(() => { isExplorePartsActiveRef.current = isExplorePartsActive; }, [isExplorePartsActive]);
  const isExplodedViewRef = useRef(isExplodedView);
  useEffect(() => { isExplodedViewRef.current = isExplodedView; }, [isExplodedView]);
  const showLabelsRef = useRef(showLabels);
  useEffect(() => { showLabelsRef.current = showLabels; }, [showLabels]);
  const showGridRef = useRef(showGrid);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  const showAxesRef = useRef(showAxes);
  useEffect(() => { showAxesRef.current = showAxes; }, [showAxes]);

  // Target vectors for smooth camera focus interpolation
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);
  const originalCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4, 8));
  const originalLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Dedicated simulation state for Newton's Cradle numerical integration
  const cradleSimRef = useRef<{
    angles: number[];
    omegas: number[];
    shockPulse: number[];
    key: string;
  }>({
    angles: [0, 0, 0, 0, 0],
    omegas: [0, 0, 0, 0, 0],
    shockPulse: [0, 0, 0, 0],
    key: '',
  });

  // Dedicated restart trigger ref for Newton's Cradle
  const cradleRestartCounterRef = useRef<number>(0);

  // Dedicated simulation state for Heat Transfer numerical integration
  const heatTransferSimRef = useRef<{
    conductionState: ConductionState;
    radiationSimTime: number;
    lastParamsKey: string;
    resetCounter: number;
    convectionPhase: number;
    radiationWavePhase: number;
  }>({
    conductionState: createConductionState(12, 20),
    radiationSimTime: 0,
    lastParamsKey: '',
    resetCounter: 0,
    convectionPhase: 0,
    radiationWavePhase: 0,
  });

  const heatRestartCounterRef = useRef<number>(0);
  const [heatTelemetryState, setHeatTelemetryState] = useState<{
    conductionTemps: number[];
    convectionMetrics: ConvectionMetrics;
    radiationMetrics: RadiationMetrics;
    activeMode: 'conduction' | 'convection' | 'radiation';
    activeMaterial: string;
    ambientTempC: number;
    heatSourceTempC: number;
  } | null>(null);

  // Dedicated simulation state for Electric Bell numerical integration & state machine
  const bellSimRef = useRef<ElectricBellState>(createInitialBellState());
  const bellRestartCounterRef = useRef<number>(0);
  const [bellTelemetryState, setBellTelemetryState] = useState<ElectricBellState | null>(null);

  // Sync external selectedPartId when passed
  useEffect(() => {
    if (selectedPartId !== undefined) {
      const match = modelSpec.parts.find((p) => p.id === selectedPartId) || null;
      handleSelectPart(match);
    }
  }, [selectedPartId, modelSpec]);

  // Label 2D screen projections
  const [screenLabels, setScreenLabels] = useState<ExternalCalloutItem[]>([]);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 500,
  });

  const handleSelectPart = (part: ModelPartSpec | null) => {
    setInspectedPart(part);
    if (onSelectPart) onSelectPart(part);

    if (part && part.position) {
      // Calculate close-up inspection target
      const pos = part.position;
      targetCameraPosRef.current = new THREE.Vector3(pos[0] + 1.2, pos[1] + 0.8, pos[2] + 2.2);
      targetLookAtRef.current = new THREE.Vector3(pos[0], pos[1], pos[2]);
    } else {
      // Return to full model view (restoring original camera and orbit controls)
      targetCameraPosRef.current = null;
      targetLookAtRef.current = null;
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  };

  /**
   * Resets only the 3D camera, orbit controls, part inspection, and model translation offset.
   */
  const handleResetCameraOnly = () => {
    targetCameraPosRef.current = null;
    targetLookAtRef.current = null;
    setInspectedPart(null);
    if (onSelectPart) onSelectPart(null);
    setModelPosition({ x: 0, y: 0 });
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(0, 0, 0);
    }
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  /**
   * Idempotent full viewer reset:
   * Restores original camera position, viewing direction, target, zoom, FOV,
   * default parameter values, default conditions, model transforms, animation clock (simTime = 0),
   * and Play/Pause state without triggering AI regeneration or switching models.
   */
  const handleFullViewerReset = () => {
    const snap = initialSnapshotRef.current || captureInitialModelStateSnapshot(modelSpec);
    const defaultParams = { ...snap.parameters };
    const defaultConds = { ...snap.conditions };

    // 1. Synchronously update parameter & condition refs for the active Three.js animation frame
    parametersRef.current = defaultParams;
    conditionsRef.current = defaultConds;

    // 2. Update internal React state & notify parent container
    setInternalParameters(defaultParams);
    setInternalConditions(defaultConds);
    if (onResetAll) {
      onResetAll(defaultParams, defaultConds);
    }
    if (onUpdateParameter) {
      Object.entries(defaultParams).forEach(([pid, val]) => {
        onUpdateParameter(pid, val);
      });
    }
    if (onUpdateCondition) {
      Object.entries(defaultConds).forEach(([cid, val]) => {
        onUpdateCondition(cid, val);
      });
    }

    // 3. Reset UI inspection, exploded view, play state, and translation controller
    setLastParamWhy(null);
    setInspectedPart(null);
    if (onSelectPart) onSelectPart(null);
    setIsExplodedView(false);
    isExplodedViewRef.current = false;
    setIsPlaying(true);
    isPlayingRef.current = true;
    setModelPosition({ x: 0, y: 0 });
    if (positionGroupRef.current) {
      positionGroupRef.current.position.set(0, 0, 0);
    }

    // 4. Reset specialized numerical simulation accumulators
    cradleRestartCounterRef.current += 1;
    heatRestartCounterRef.current += 1;
    bellRestartCounterRef.current += 1;
    bellSimRef.current = createInitialBellState();

    // 5. Signal the Three.js animation loop to reset simTime = 0, velocities, and part transforms
    resetSimTriggerRef.current += 1;

    // 6. Immediately restore camera position, target, rotation, zoom, FOV, and OrbitControls spherical coords
    targetCameraPosRef.current = null;
    targetLookAtRef.current = null;
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const inspectedPartRef = useRef<ModelPartSpec | null>(null);
  inspectedPartRef.current = inspectedPart;

  const applyPartBlueHighlightToMap = (map: Map<string, THREE.Object3D>, selectedId: string | null) => {
    map.forEach((obj, partId) => {
      const isSelected = selectedId === partId;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          const mat = (child as any).material;
          const applyHighlight = (m: THREE.Material) => {
            if (!m) return;
            if ('emissive' in m) {
              const stdMat = m as THREE.MeshStandardMaterial;
              if (stdMat.userData.defaultEmissive === undefined) {
                stdMat.userData.defaultEmissive = stdMat.emissive.clone();
                stdMat.userData.defaultEmissiveIntensity = stdMat.emissiveIntensity;
              }
              if (isSelected) {
                stdMat.emissive.set(0x38bdf8);
                stdMat.emissiveIntensity = 0.85;
              } else {
                stdMat.emissive.copy(stdMat.userData.defaultEmissive);
                stdMat.emissiveIntensity = stdMat.userData.defaultEmissiveIntensity;
              }
            } else if ('color' in m) {
              const basicMat = m as THREE.MeshBasicMaterial;
              if (basicMat.userData.defaultColor === undefined) {
                basicMat.userData.defaultColor = basicMat.color.clone();
              }
              if (isSelected) {
                basicMat.color.set(0x38bdf8);
              } else {
                basicMat.color.copy(basicMat.userData.defaultColor);
              }
            }
          };

          if (Array.isArray(mat)) {
            mat.forEach(applyHighlight);
          } else if (mat) {
            applyHighlight(mat);
          }
        }
      });
    });
  };

  // Dynamically highlight inspected/clicked component with light blue (0x38bdf8 / #38bdf8)
  useEffect(() => {
    if (!meshMapRef.current) return;
    applyPartBlueHighlightToMap(meshMapRef.current, inspectedPart?.id ?? null);
  }, [inspectedPart]);

  const handleParamSliderChange = (paramId: string, value: number) => {
    const param = modelSpec.parameters[paramId];
    if (param) {
      const oldVal = parameters[paramId] ?? param.defaultValue;
      const isHigher = value > oldVal;
      let observation = `Adjusted ${param.name} from ${oldVal} ${param.unit} to ${value} ${param.unit}.`;
      let why = `The governing mathematical formulas updated the 3D model kinematics in real time.`;

      if (modelSpec.functionalType === 'newtons-cradle' || modelSpec.id.includes('cradle')) {
        if (paramId === 'ballCountDisplaced') {
          observation = `Displaced ${value} sphere(s). Upon impact, exactly ${value} sphere(s) will be ejected on the opposite end.`;
          why = `Simultaneous conservation of linear momentum (∑p = mv) and kinetic energy (∑Ek = ½mv²) uniquely requires that the number of incoming spheres equals the outgoing spheres!`;
        } else if (paramId === 'pendulumLength') {
          const g = parameters.gravity ?? 9.8;
          const T = (2 * Math.PI * Math.sqrt(value / g)).toFixed(2);
          observation = `Suspension length L adjusted to ${value} m. Oscillation period recalculated as T = ${T} s.`;
          why = `Longer pendulums have longer arc trajectories, increasing the period according to T = 2π√(L/g) independent of ball mass.`;
        } else if (paramId === 'gravity') {
          const L = parameters.pendulumLength ?? 1.6;
          const T = (2 * Math.PI * Math.sqrt(L / value)).toFixed(2);
          observation = `Gravitational acceleration g set to ${value} m/s² (Period T = ${T} s).`;
          why = `Gravity provides the pendulum restoring force -mg sin(θ). Higher g accelerates the swing rate and increases impact velocity v = √(2gL(1-cosθ)).`;
        } else if (paramId === 'releaseAngle' || paramId === 'releaseHeight') {
          observation = `Release angle θ₀ set to ${value}°. Initial potential energy Ep = mgL(1 - cos θ₀) establishes impact velocity.`;
          why = `Impact velocity v = √(2gL(1 - cos θ₀)). Larger release angles impart greater momentum p = mv into the compressive collision.`;
        } else if (paramId === 'damping') {
          observation = `Damping coefficient set to ${value} ${value === 0 ? '(Ideal perpetual motion)' : '(Realistic decay)'}.`;
          why = `Aerodynamic drag and steel viscoelastic hysteresis dissipate kinetic energy into micro-acoustic waves and heat.`;
        } else if (paramId === 'elasticity') {
          observation = `Restitution coefficient e set to ${value} ${value === 1.0 ? '(Ideal elastic collision, 100% KE conserved)' : '(Inelastic energy dissipation)'}.`;
          why = `Coefficient of restitution e = (v₂' - v₁') / (v₁ - v₂). e = 1.0 conserves mechanical energy perfectly across impacts.`;
        }
      } else if (modelSpec.functionalType === 'bonding-explorer') {
        if (paramId === 'reactionProgress') {
          observation =
            value === 0
              ? 'Separate neutral ground-state atoms: unperturbed valence shells and neutral zero net charges.'
              : value < 100
              ? `Reaction in progress (${value}%): valence electrons transitioning across the internuclear gradient.`
              : 'Completed bonded state: stable octet/duet electronic configurations achieved.';
          why =
            'Atoms interact to achieve low-energy, thermodynamically stable noble-gas electron configurations (octet rule). Ionic bonding transfers electrons via large electronegativity differences; covalent bonding shares electron pairs.';
        } else if (paramId === 'atomSeparation') {
          observation = `Internuclear separation set to ${value} Å.`;
          why =
            'Bond length represents the potential energy minimum (Lennard-Jones / Morse potential) balancing electrostatic electron-nucleus attraction against internuclear proton-proton repulsion.';
        }
      } else if (modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer') {
        const tamb = parameters.initialTempC ?? 20;
        if (paramId === 'heatSourceTempC') {
          observation = `Operating heat source temperature set to ${value} °C (ΔT = ${value - tamb} °C above ambient).`;
          why = `Heat transfer rates across all three modes depend directly on temperature differential ΔT: Fourier's law of conduction (dQ/dt = -k·A·dT/dx), buoyant fluid circulation speed (v ∝ √ΔT), and Stefan-Boltzmann radiation emission (P ∝ T⁴).`;
        } else if (paramId === 'initialTempC') {
          observation = `Ambient environment and specimen initial temperature set to ${value} °C.`;
          why = `Ambient temperature establishes the thermal sink baseline. In accordance with the Second Law of Thermodynamics, heat naturally diffuses spontaneously down temperature gradients toward ambient equilibrium.`;
        } else if (paramId === 'thermalConductivity') {
          observation = `Conduction rod thermal conductivity k set to ${value} W/(m·K).`;
          why = `Thermal conductivity k quantifies a material's capacity to transport heat through microscopic phonon lattice vibrations and free valence electron collisions. High-k metals propagate heat waves orders of magnitude faster than insulators.`;
        } else if (paramId === 'radiationEmissivity') {
          observation = `Surface radiation emissivity ε set to ${value} (ideal blackbody is ε = 1.0).`;
          why = `Stefan-Boltzmann Law dictates that thermal radiation emission power P = ε·σ·A·(T₁⁴ - T_amb⁴). Higher emissivity surfaces emit and absorb electromagnetic infrared waves much more efficiently across empty space.`;
        }
      } else if (modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell') {
        if (paramId === 'operatingVoltage') {
          observation = `DC supply voltage adjusted to ${value} V. Peak coil current scales to I = V/R = ${(value / 4).toFixed(2)} A.`;
          why = `Ohm's law (I = V/R) and Ampere's law dictate that higher voltage increases the coil current, which intensifies the magnetic field B and magnetic pulling force F_mag ∝ I² on the iron armature.`;
        } else if (paramId === 'springTension') {
          observation = `Return spring leaf stiffness k set to ${value} N/m.`;
          why = `Hooke's law (F_spring = -k·x) governs the mechanical restoring force. A stiffer spring accelerates the return stroke and increases the make-and-break interrupter frequency.`;
        } else if (paramId === 'bellRingingSpeed') {
          observation = `Make-and-break oscillation frequency set to ${value} Hz.`;
          why = `Self-interrupting cycle period is determined by electrical coil charging time (L/R time constant) plus mechanical armature transit and spring recoil times.`;
        }
      } else if (modelSpec.functionalType === 'blood-transport' || modelSpec.id === 'blood-transport') {
        if (paramId === 'heartRateBpm') {
          observation = `Cardiac pulse frequency adjusted to ${value} BPM (cycle duration = ${(60 / value).toFixed(2)} s).`;
          why = `Chronotropic rate modulates ventricular systole (~35% of cycle) and diastolic filling (~65%). Higher BPM accelerates blood ejection velocity through the aorta and pulmonary trunk.`;
        } else if (paramId === 'bloodFlowVelocity') {
          observation = `Directional circulatory flow velocity factor set to ${value.toFixed(1)}×.`;
          why = `Poiseuille's law (Q = ΔP·π·r⁴ / 8ηL) and vascular cross-sectional area dictate blood velocity: high in large conduit arteries (~40 cm/s in aorta) and slowed in capillaries (< 1 mm/s) for optimal gas exchange.`;
        } else if (paramId === 'cardiacOutput') {
          const hr = (parameters.heartRateBpm as number) || 72;
          observation = `Cardiac Output (CO) set to ${value} L/min (Stroke Volume = ${((value * 1000) / hr).toFixed(1)} mL/beat).`;
          why = `Cardiac Output (CO = Heart Rate × Stroke Volume) is the key determinant of global oxygen delivery to systemic tissues. Normal resting output is ~5.0 L/min.`;
        }
      } else if (param.affects === 'animationSpeed') {
        observation = isHigher
          ? `The operational frequency and speed increased noticeably (${value} ${param.unit}).`
          : `The mechanism slowed down to a lower cycle rate (${value} ${param.unit}).`;
        why = `Rotational and kinematic velocity scales with input driving rate. Higher drive overcomes mechanical and inertial resistance faster.`;
      } else if (param.affects === 'objectScale') {
        observation = `Physical dimensions scaled by a factor of ${(value / (param.defaultValue || 1)).toFixed(2)}×.`;
        why = `Altering physical dimensions changes component geometry, volumetric displacement, and optical/mechanical properties.`;
      } else {
        observation = `Parameter ${param.name} set to ${value} ${param.unit}; live simulation state recalculated.`;
        why = `Governing equations for ${modelSpec.title} updated all connected physical parts.`;
      }

      setLastParamWhy({
        title: `⚡ ${param.name.toUpperCase()} CHANGED (${oldVal} ➔ ${value} ${param.unit})`,
        observation,
        why,
      });
    }
    if (onUpdateParameter) {
      onUpdateParameter(paramId, value);
    } else {
      setInternalParameters((prev) => ({ ...prev, [paramId]: value }));
    }
  };

  useEffect(() => {
    // If heart model, respiratory model, or embedded model, do not initialize Three.js canvas
    if (isCustomEmbedModel) return;

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const camPos = modelSpec.camera?.position || [0, 4, 8];
    const camTarget = modelSpec.camera?.target || [0, 0, 0];
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    cameraRef.current = camera;
    originalCameraPosRef.current.set(camPos[0], camPos[1], camPos[2]);
    originalLookAtRef.current.set(camTarget[0], camTarget[1], camTarget[2]);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 1.5,
      maxDistance: 35,
    });
    controls.saveInitialState(
      new THREE.Vector3(camPos[0], camPos[1], camPos[2]),
      new THREE.Vector3(camTarget[0], camTarget[1], camTarget[2])
    );
    controlsRef.current = controls;

    // Studio 3-Point Lighting with Soft Depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(8, 14, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-8, -2, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 0.35);
    rimLight.position.set(0, 6, -10);
    scene.add(rimLight);

    // Floor Grid - elevated dynamically beneath the lowest model geometry
    let minY = -2.2;
    modelSpec.parts.forEach((p) => {
      const py = p.position?.[1] ?? 0;
      const h = p.dimensions?.[1] ?? (p.dimensions?.[0] ?? 1);
      const bottom = py - h / 2;
      if (bottom < minY) minY = bottom - 0.25;
    });

    const grid = new THREE.GridHelper(18, 18, 0x94a3b8, 0xe2e8f0);
    grid.position.y = minY;
    grid.visible = showGrid;
    scene.add(grid);

    const isBatch1Studio = isAdvancedPhysicsBatch1Model(modelSpec.functionalType, modelSpec.id);
    const isBatch2Studio = isAdvancedPhysicsBatch2Model(modelSpec.functionalType, modelSpec.id);
    const isBatch3Studio = isAdvancedPhysicsBatch3Model(modelSpec.functionalType, modelSpec.id);
    const isBatch4Studio = isAdvancedPhysicsBatch4Model(modelSpec.functionalType, modelSpec.id);
    const isChemBatch1Studio = isChemistryBatch1Model(modelSpec.functionalType, modelSpec.id);
    const isChemBatch2Studio = isChemistryBatch2Model(modelSpec.functionalType, modelSpec.id);
    const isPreBatch1Studio = isPreBatch1Model(modelSpec.functionalType, modelSpec.id);
    let disposeBatch1StudioEnv: (() => void) | null = null;
    let disposePreBatch1StudioEnv: (() => void) | null = null;
    if (isBatch1Studio || isBatch2Studio || isBatch3Studio || isBatch4Studio || isChemBatch1Studio || isChemBatch2Studio) {
      ambientLight.intensity = 0.42;
      keyLight.intensity = 1.45;
      fillLight.intensity = 0.68;
      rimLight.intensity = 0.78;
      const studioSetup = setupBatch1StudioEnvironment(scene, renderer, minY);
      disposeBatch1StudioEnv = studioSetup.dispose;
    } else if (isPreBatch1Studio) {
      ambientLight.intensity = 0.48;
      keyLight.intensity = 1.42;
      fillLight.intensity = 0.65;
      rimLight.intensity = 0.75;
      const preBatchStudio = setupPreBatch1StudioEnvironment(scene, renderer, minY);
      styleStudioGridHelper(grid);
      disposePreBatch1StudioEnv = preBatchStudio.dispose;
    }

    // Axes
    const axes = new THREE.AxesHelper(2.5);
    axes.position.set(0, minY + 0.02, 0);
    axes.visible = showAxes;
    scene.add(axes);

    // Universal 3D Model Position Parent Group
    const positionGroup = new THREE.Group();
    positionGroup.position.set(modelPosition.x, modelPosition.y, 0);
    positionGroupRef.current = positionGroup;
    scene.add(positionGroup);

    // Root model hierarchy
    const modelRoot = new THREE.Group();
    positionGroup.add(modelRoot);

    // Dedicated Rotor Group for rotating electromagnetic assemblies (DC motor)
    const rotorGroup = new THREE.Group();
    modelRoot.add(rotorGroup);

    const meshMap = new Map<string, THREE.Object3D>();
    const interactiveMeshes: THREE.Object3D[] = [];

    // Helper: Material synthesis with physical properties
    const createMaterial = (part: ModelPartSpec, isSelected: boolean): THREE.Material => {
      const baseColor = new THREE.Color(part.color || '#3b82f6');
      const emissiveColor = isSelected ? new THREE.Color('#38bdf8') : (part.material === 'glow' ? baseColor : new THREE.Color(0x000000));
      const emissiveIntensity = isSelected ? 0.85 : (part.material === 'glow' ? 0.75 : 0);

      switch (part.material) {
        case 'glass':
          return new THREE.MeshPhysicalMaterial({
            color: baseColor,
            transmission: 0.92,
            transparent: true,
            opacity: part.opacity ?? 0.75,
            roughness: 0.05,
            ior: 1.52,
            reflectivity: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
          });

        case 'liquid':
          return new THREE.MeshPhysicalMaterial({
            color: baseColor,
            transmission: 0.88,
            transparent: true,
            opacity: part.opacity ?? 0.82,
            roughness: 0.08,
            ior: 1.33,
            reflectivity: 0.4,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
          });

        case 'copper':
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color('#c86432'),
            metalness: 0.9,
            roughness: 0.22,
            emissive: emissiveColor,
            emissiveIntensity,
          });

        case 'metal':
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: 0.88,
            roughness: 0.18,
            emissive: emissiveColor,
            emissiveIntensity,
          });

        case 'bone':
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: 0.06,
            roughness: 0.55,
            emissive: emissiveColor,
            emissiveIntensity,
          });

        case 'rubber':
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: 0.04,
            roughness: 0.85,
            emissive: emissiveColor,
            emissiveIntensity,
          });

        case 'tissue':
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: 0.04,
            roughness: 0.65,
            emissive: emissiveColor,
            emissiveIntensity,
          });

        case 'wireframe':
          return new THREE.MeshBasicMaterial({
            color: baseColor,
            wireframe: true,
          });

        case 'glow':
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 0.75,
            roughness: 0.2,
          });

        default:
          return new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.35,
            metalness: 0.15,
            emissive: emissiveColor,
            emissiveIntensity,
          });
      }
    };

    // Construct meshes for all parts
    modelSpec.parts.forEach((part) => {
      let geo: THREE.BufferGeometry;
      const dims = part.dimensions || [1, 1, 1];

      if (isPreBatch1Studio) {
        geo = createPreBatch1UpgradedGeometry(part);
      } else {
        switch (part.shape) {
          case 'box':
            geo = new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
            break;
          case 'cylinder': {
            const isPrism = part.id.includes('prism') || (part.name && part.name.toLowerCase().includes('prism'));
            const radSegments = isPrism ? 3 : 28;
            geo = new THREE.CylinderGeometry(dims[0] || 0.5, dims[0] || 0.5, dims[1] || 1, radSegments);
            break;
          }
          case 'sphere':
            geo = new THREE.SphereGeometry(dims[0] || 0.5, 32, 32);
            break;
          case 'cone':
            geo = new THREE.ConeGeometry(dims[0] || 0.5, dims[1] || 1, 28);
            break;
          case 'torus':
            geo = new THREE.TorusGeometry(dims[0] || 1, dims[1] || 0.2, 16, 36);
            break;
          case 'ring':
            geo = new THREE.RingGeometry(dims[0] || 0.8, dims[1] || 1.2, 32);
            break;
          case 'capsule':
            geo = new THREE.CapsuleGeometry(dims[0] || 0.4, dims[1] || 1.0, 16, 24);
            break;
          case 'octahedron':
            geo = new THREE.OctahedronGeometry(dims[0] || 0.8);
            break;
          default:
            geo = new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
            break;
        }
      }

      const isInspected = inspectedPart?.id === part.id;
      const mat = isPreBatch1Studio
        ? createPreBatch1UpgradedMaterial(part, isInspected)
        : createMaterial(part, isInspected);
      const mesh = new THREE.Mesh(geo, mat);

      const pos = part.position || [0, 0, 0];
      mesh.position.set(pos[0], pos[1], pos[2]);

      if (part.rotation) {
        mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
      }
      if (part.scale) {
        mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const basePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
      const baseRot = new THREE.Euler(
        part.rotation?.[0] ?? 0,
        part.rotation?.[1] ?? 0,
        part.rotation?.[2] ?? 0
      );
      const baseScaleVec = new THREE.Vector3(
        part.scale?.[0] ?? 1,
        part.scale?.[1] ?? 1,
        part.scale?.[2] ?? 1
      );
      const dist = basePos.length();
      let explodedPos: THREE.Vector3;
      if (dist > 0.1) {
        explodedPos = basePos.clone().multiplyScalar(1.9);
      } else {
        explodedPos = new THREE.Vector3(0, 1.4, 0);
      }
      mesh.userData = {
        partSpec: part,
        basePosition: basePos,
        baseRotation: baseRot,
        baseScale: baseScaleVec,
        baseVisible: true,
        explodedPosition: explodedPos,
      };

      // Component grouping: Rotor vs Stator vs Standard Root
      if (part.groupId === 'rotor' && modelSpec.functionalType === 'dc-motor-assembly') {
        rotorGroup.add(mesh);
      } else {
        modelRoot.add(mesh);
      }

      meshMap.set(part.id, mesh);
      interactiveMeshes.push(mesh);
    });
    meshMapRef.current = meshMap;

    // Build custom composite 3D assemblies for Advanced Physics Batch 1 (41–47), Batch 2 (48–54) & Batch 3 (55–61)
    let batch1Handles: Batch1SceneHandles | null = null;
    if (isBatch1Studio) {
      batch1Handles = buildBatch1CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    let batch2Handles: Batch2SceneHandles | null = null;
    if (isBatch2Studio) {
      batch2Handles = buildBatch2CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    let batch3Handles: Batch3SceneHandles | null = null;
    if (isBatch3Studio) {
      batch3Handles = buildBatch3CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    let batch4Handles: Batch4SceneHandles | null = null;
    if (isBatch4Studio) {
      batch4Handles = buildBatch4CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    let chemBatch1Handles: ChemistryBatch1SceneHandles | null = null;
    if (isChemBatch1Studio) {
      chemBatch1Handles = buildChemistryBatch1CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    let chemBatch2Handles: ChemistryBatch2SceneHandles | null = null;
    if (isChemBatch2Studio) {
      chemBatch2Handles = buildChemistryBatch2CustomAssemblies(modelSpec, modelRoot, meshMap, interactiveMeshes);
    }
    if (isPreBatch1Studio) {
      enhancePreBatch1ModelAssemblies(modelSpec, meshMap, interactiveMeshes);
    }

    // -------------------------------------------------------------
    // SPECIALIZED FUNCTIONAL DOMAIN RENDERERS & SIMULATION AUXILIARIES
    // -------------------------------------------------------------

    // 1. ASTRONOMICAL TELESCOPE: Dynamic Optical Ray Tracing
    let rayLines: THREE.LineSegments | null = null;
    let rayGeo: THREE.BufferGeometry | null = null;
    if (
      modelSpec.functionalType === 'optical-telescope' ||
      modelSpec.id.includes('telescope')
    ) {
      const maxRayPoints = 64;
      const rPositions = new Float32Array(maxRayPoints * 3);
      rayGeo = new THREE.BufferGeometry();
      rayGeo.setAttribute('position', new THREE.BufferAttribute(rPositions, 3));

      const rayMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: conditions.showRayTraces !== false ? 0.85 : 0.0,
      });
      rayLines = new THREE.LineSegments(rayGeo, rayMat);
      modelRoot.add(rayLines);
    }

    // 2. RUTHERFORD SCATTERING: Multi-Beam Alpha Particle Kinetics & Scintillation Screen
    const rutherfordParticles: RutherfordParticle[] = [];
    const maxParticles = 240;
    let particlePointsGeo: THREE.BufferGeometry | null = null;
    let particlePointsObj: THREE.Points | null = null;
    let rutherfordRayLines: THREE.LineSegments | null = null;
    let rutherfordRayGeo: THREE.BufferGeometry | null = null;
    let rutherfordBeamGlow: THREE.Mesh | null = null;
    const flashes: ScintillationFlash[] = [];
    let flashMesh: THREE.InstancedMesh | null = null;

    if (
      modelSpec.functionalType === 'rutherford-scattering' ||
      modelSpec.id.includes('rutherford')
    ) {
      // A. Continuous Alpha Particle Trajectory Lines (Multi-ray bundle)
      const rayPts: THREE.Vector3[] = [];
      const rayColors: number[] = [];
      const colCyan = new THREE.Color(0x38bdf8);
      const colGold = new THREE.Color(0xfacc15);
      const colGreen = new THREE.Color(0x34d399);
      const colRose = new THREE.Color(0xf43f5e);

      const addRay = (p1: THREE.Vector3, p2: THREE.Vector3, color: THREE.Color) => {
        rayPts.push(p1, p2);
        rayColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
      };

      // 1. Incident Central Ray Bundle (Collimated pencil beam: z = 4.2 to z = 0.0)
      const incRadii = [0, 0.03, 0.03, 0.03, 0.03, 0.055, 0.055, 0.055];
      const incAngles = [0, 0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.75];
      for (let i = 0; i < incRadii.length; i++) {
        const rx = Math.cos(incAngles[i]) * incRadii[i];
        const ry = Math.sin(incAngles[i]) * incRadii[i];
        addRay(
          new THREE.Vector3(rx, 0.4 + ry, 4.2),
          new THREE.Vector3(rx, 0.4 + ry, 0.0),
          colCyan
        );
        // Transmitted undeviated ray continuing straight through foil to phosphor screen (z = -3.4)
        addRay(
          new THREE.Vector3(rx, 0.4 + ry, 0.0),
          new THREE.Vector3(rx * 1.1, 0.4 + ry * 1.1, -3.4),
          colGold
        );
      }

      // 2. Small-Angle Deflected Rays (3° - 15°)
      const smallThetas = [0.08, 0.14, 0.22, 0.11, 0.17, 0.24, 0.13, 0.2];
      const smallPhis = [0, Math.PI * 0.35, Math.PI * 0.7, Math.PI * 1.05, Math.PI * 1.4, Math.PI * 1.75, Math.PI * 0.5, Math.PI * 1.25];
      for (let i = 0; i < smallThetas.length; i++) {
        const th = smallThetas[i];
        const ph = smallPhis[i];
        const d = 3.4;
        addRay(
          new THREE.Vector3(0, 0.4, 0),
          new THREE.Vector3(Math.sin(th) * Math.cos(ph) * d, 0.4 + Math.sin(th) * Math.sin(ph) * d * 0.4, -Math.cos(th) * d),
          colGold
        );
      }

      // 3. Moderate Deflected Rays (25° - 65°)
      const modThetas = [0.45, 0.65, 0.85, 0.5, 0.75, 1.05, 0.55, 0.9];
      const modPhis = [Math.PI * 0.1, Math.PI * 0.55, Math.PI * 1.0, Math.PI * 1.45, Math.PI * 1.85, Math.PI * 0.3, Math.PI * 0.8, Math.PI * 1.2];
      for (let i = 0; i < modThetas.length; i++) {
        const th = modThetas[i];
        const ph = modPhis[i];
        const d = 3.4;
        addRay(
          new THREE.Vector3(0, 0.4, 0),
          new THREE.Vector3(Math.sin(th) * Math.cos(ph) * d, 0.4 + Math.sin(th) * Math.sin(ph) * d * 0.35, -Math.cos(th) * d),
          colGreen
        );
      }

      // 4. Large-Angle Backscattered Rays (110° - 150° historic reflection)
      const backThetas = [2.0, 2.35, 2.15, 2.5];
      const backPhis = [Math.PI * 0.2, Math.PI * 0.85, Math.PI * 1.2, Math.PI * 1.75];
      for (let i = 0; i < backThetas.length; i++) {
        const th = backThetas[i];
        const ph = backPhis[i];
        const d = 3.35;
        addRay(
          new THREE.Vector3(0, 0.4, 0),
          new THREE.Vector3(Math.sin(th) * Math.cos(ph) * d, 0.4 + Math.sin(th) * Math.sin(ph) * d * 0.3, -Math.cos(th) * d),
          colRose
        );
      }

      rutherfordRayGeo = new THREE.BufferGeometry().setFromPoints(rayPts);
      rutherfordRayGeo.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3));
      const rayMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: conditions.showTrajectories !== false ? 0.75 : 0.0,
      });
      rutherfordRayLines = new THREE.LineSegments(rutherfordRayGeo, rayMat);
      modelRoot.add(rutherfordRayLines);

      // B. Ionized Incident Beam Cylinder Glow (Cylindrical sheath along beamline)
      const glowGeo = new THREE.CylinderGeometry(0.065, 0.065, 4.2, 16);
      glowGeo.rotateX(Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      });
      rutherfordBeamGlow = new THREE.Mesh(glowGeo, glowMat);
      rutherfordBeamGlow.position.set(0, 0.4, 2.1);
      modelRoot.add(rutherfordBeamGlow);

      // C. Alpha Particle Streams (240 particles streaming continuously)
      for (let i = 0; i < maxParticles; i++) {
        const channel = i % 12;
        const ang = channel * (Math.PI / 6);
        const rad = 0.01 + ((i * 7) % 5) * 0.012;
        // Distribute initial Z throughout the path from 4.2 to -3.4 so simulation is immediately continuous
        const initialZ = 4.2 - (i / maxParticles) * 7.6;
        const p: RutherfordParticle = {
          x: Math.cos(ang) * rad,
          y: 0.4 + Math.sin(ang) * rad,
          z: initialZ,
          vx: 0,
          vy: 0,
          vz: -4.0,
          scattered: initialZ <= 0,
          active: true,
          age: (i / maxParticles) * 2.0,
          channel,
          pathType: 'straight',
        };

        if (initialZ <= 0) {
          // Pre-assign scattered trajectories for particles starting past foil
          if (i % 32 === 0) {
            p.pathType = 'backscatter';
            const theta = Math.PI * 0.65 + Math.random() * 0.25;
            const phi = Math.random() * Math.PI * 2;
            const spd = 3.8;
            p.vz = spd * Math.cos(theta);
            p.vx = spd * Math.sin(theta) * Math.cos(phi);
            p.vy = spd * Math.sin(theta) * Math.sin(phi);
          } else if (i % 8 === 0) {
            p.pathType = 'moderate';
            const theta = (20 + Math.random() * 40) * (Math.PI / 180);
            const phi = Math.random() * Math.PI * 2;
            const spd = 4.0;
            p.vz = -spd * Math.cos(theta);
            p.vx = spd * Math.sin(theta) * Math.cos(phi);
            p.vy = spd * Math.sin(theta) * Math.sin(phi);
          } else if (i % 3 === 0) {
            p.pathType = 'small';
            const theta = (4 + Math.random() * 12) * (Math.PI / 180);
            const phi = Math.random() * Math.PI * 2;
            const spd = 4.1;
            p.vz = -spd * Math.cos(theta);
            p.vx = spd * Math.sin(theta) * Math.cos(phi);
            p.vy = spd * Math.sin(theta) * Math.sin(phi);
          }
        }
        rutherfordParticles.push(p);
      }

      particlePointsGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(maxParticles * 3);
      particlePointsGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: 0xfef08a,
        size: 0.11,
        transparent: true,
        opacity: 0.95,
      });
      particlePointsObj = new THREE.Points(particlePointsGeo, particleMat);
      modelRoot.add(particlePointsObj);

      const flashGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const flashMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      flashMesh = new THREE.InstancedMesh(flashGeo, flashMat, 40);
      flashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      modelRoot.add(flashMesh);
    }

    // 3. PENDULUM HARMONICS: Force Vector Arrows
    const pendulumVectorGroup = new THREE.Group();
    modelRoot.add(pendulumVectorGroup);
    let velocityArrow: THREE.ArrowHelper | null = null;
    let tensionArrow: THREE.ArrowHelper | null = null;

    if (
      modelSpec.functionalType === 'pendulum-harmonics' ||
      modelSpec.id.includes('pendulum')
    ) {
      velocityArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        0.8,
        0x06b6d4,
        0.2,
        0.15
      );
      tensionArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        1.1,
        0xf59e0b,
        0.2,
        0.15
      );
      pendulumVectorGroup.add(velocityArrow);
      pendulumVectorGroup.add(tensionArrow);
      pendulumVectorGroup.visible = conditions.showVectors !== false;
    }

    // 4. BAR MAGNET: 3D Dipole Magnetic Field Lines & Flux Particles
    let magnetFluxPoints: THREE.Points | null = null;
    let magnetFluxGeo: THREE.BufferGeometry | null = null;
    const numFluxParticles = 48;
    const fluxTrajParams: { u: number; phi: number; R: number }[] = [];

    if (
      modelSpec.functionalType === 'bar-magnet-field' ||
      modelSpec.id.includes('magnet')
    ) {
      const fieldLineGroup = new THREE.Group();
      modelRoot.add(fieldLineGroup);

      const fieldRadii = [1.5, 2.3, 3.2];
      const fieldAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
      const fieldLineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
      });

      fieldRadii.forEach((R) => {
        fieldAngles.forEach((phi) => {
          const curvePts: THREE.Vector3[] = [];
          for (let step = 0; step <= 32; step++) {
            const u = (step / 32) * Math.PI; // 0 to PI
            const x = 1.1 * Math.cos(u);
            const rPerp = R * Math.sin(u);
            const y = rPerp * Math.sin(phi);
            const z = rPerp * Math.cos(phi);
            curvePts.push(new THREE.Vector3(x, y, z));
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
          fieldLineGroup.add(new THREE.Line(lineGeo, fieldLineMat));
        });
      });

      // Flux pulse particles traveling along field lines
      magnetFluxGeo = new THREE.BufferGeometry();
      const fluxPos = new Float32Array(numFluxParticles * 3);
      magnetFluxGeo.setAttribute('position', new THREE.BufferAttribute(fluxPos, 3));
      const fluxMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
      });
      magnetFluxPoints = new THREE.Points(magnetFluxGeo, fluxMat);
      modelRoot.add(magnetFluxPoints);

      for (let i = 0; i < numFluxParticles; i++) {
        fluxTrajParams.push({
          u: (i / numFluxParticles) * Math.PI,
          phi: fieldAngles[i % fieldAngles.length],
          R: fieldRadii[Math.floor(i / fieldAngles.length) % fieldRadii.length],
        });
      }
    }

    // 5. SOLAR SYSTEM: Orbital Paths for all 8 Planets
    if (modelSpec.functionalType === 'solar-system') {
      const orbitRingGroup = new THREE.Group();
      modelRoot.add(orbitRingGroup);
      const planetRadii = [1.8, 2.7, 3.8, 4.9, 6.3, 7.8, 9.2, 10.6];
      const ringMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 });

      planetRadii.forEach((r) => {
        const ringPts: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          const th = (i / 64) * Math.PI * 2;
          ringPts.push(new THREE.Vector3(r * Math.cos(th), 0, r * Math.sin(th)));
        }
        orbitRingGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat));
      });
    }

    // 6. COMPOUND MICROSCOPE: Substage Optical Illumination Cone
    let microscopeBeam: THREE.Mesh | null = null;
    if (modelSpec.functionalType === 'compound-microscope') {
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.28, 2.4, 24, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      microscopeBeam = new THREE.Mesh(beamGeo, beamMat);
      microscopeBeam.position.set(0, -0.6, 0);
      modelRoot.add(microscopeBeam);
    }

    // 7. NEPHRON & CELL: Transport Flow Particles
    let flowPoints: THREE.Points | null = null;
    let flowGeo: THREE.BufferGeometry | null = null;
    const numFlowParticles = 40;
    const flowT: number[] = [];

    if (modelSpec.functionalType === 'nephron' || modelSpec.functionalType === 'eukaryotic-cell') {
      flowGeo = new THREE.BufferGeometry();
      const posArr = new Float32Array(numFlowParticles * 3);
      flowGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const ptMat = new THREE.PointsMaterial({
        color: modelSpec.functionalType === 'nephron' ? 0x38bdf8 : 0xf43f5e,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
      });
      flowPoints = new THREE.Points(flowGeo, ptMat);
      modelRoot.add(flowPoints);

      for (let i = 0; i < numFlowParticles; i++) {
        flowT.push(i / numFlowParticles);
      }
    }

    // -------------------------------------------------------------
    // AUXILIARY RENDERERS FOR MODELS 11–20
    // -------------------------------------------------------------
    // Model 11: FRICTION EXPLORER: Microscopic asperities
    const frictionAuxGroup = new THREE.Group();
    modelRoot.add(frictionAuxGroup);
    let asperitiesMesh: THREE.LineSegments | null = null;
    if (modelSpec.functionalType === 'friction-explorer') {
      const aspPoints: THREE.Vector3[] = [];
      for (let i = -1.2; i <= 1.2; i += 0.08) {
        const toothH = ((Math.abs(Math.sin(i * 35)) * 0.12) + 0.04);
        aspPoints.push(new THREE.Vector3(i, 0.02, 0));
        aspPoints.push(new THREE.Vector3(i + 0.04, 0.02 + toothH, 0));
        aspPoints.push(new THREE.Vector3(i + 0.04, 0.02 + toothH, 0));
        aspPoints.push(new THREE.Vector3(i + 0.08, 0.02, 0));
      }
      const aspGeo = new THREE.BufferGeometry().setFromPoints(aspPoints);
      const aspMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
      asperitiesMesh = new THREE.LineSegments(aspGeo, aspMat);
      frictionAuxGroup.add(asperitiesMesh);
    }

    // Model 12: WAVE MOTION EXPLORER: Continuous 3D wave line
    let waveLine: THREE.Line | null = null;
    let waveGeo: THREE.BufferGeometry | null = null;
    const numWavePts = 120;
    const wavePositions = new Float32Array(numWavePts * 3);
    if (modelSpec.functionalType === 'wave-motion') {
      waveGeo = new THREE.BufferGeometry();
      for (let i = 0; i < numWavePts; i++) {
        const x = -5.0 + (i / (numWavePts - 1)) * 10.0;
        wavePositions[i * 3] = x;
        wavePositions[i * 3 + 1] = 0;
        wavePositions[i * 3 + 2] = 0;
      }
      waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
      const waveMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
      waveLine = new THREE.Line(waveGeo, waveMat);
      modelRoot.add(waveLine);
    }

    // Model 13: SOUND WAVE EXPLORER: 180 longitudinal air particles & pressure wave line
    let soundParticlesObj: THREE.Points | null = null;
    let soundParticlesGeo: THREE.BufferGeometry | null = null;
    const numSoundParticles = 180;
    const soundEquilibriumX = new Float32Array(numSoundParticles);
    const soundParticlePos = new Float32Array(numSoundParticles * 3);
    let pressureSineLine: THREE.Line | null = null;
    let pressureSineGeo: THREE.BufferGeometry | null = null;
    const numPressurePts = 80;
    const pressurePos = new Float32Array(numPressurePts * 3);

    if (modelSpec.functionalType === 'sound-wave') {
      soundParticlesGeo = new THREE.BufferGeometry();
      for (let i = 0; i < numSoundParticles; i++) {
        const eqX = -3.8 + (i / (numSoundParticles - 1)) * 7.6;
        soundEquilibriumX[i] = eqX;
        const r = 0.1 + Math.random() * 0.85;
        const th = Math.random() * Math.PI * 2;
        soundParticlePos[i * 3] = eqX;
        soundParticlePos[i * 3 + 1] = r * Math.sin(th);
        soundParticlePos[i * 3 + 2] = r * Math.cos(th);
      }
      soundParticlesGeo.setAttribute('position', new THREE.BufferAttribute(soundParticlePos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.12,
        transparent: true,
        opacity: 0.88,
      });
      soundParticlesObj = new THREE.Points(soundParticlesGeo, pMat);
      modelRoot.add(soundParticlesObj);

      pressureSineGeo = new THREE.BufferGeometry();
      for (let i = 0; i < numPressurePts; i++) {
        const x = -3.8 + (i / (numPressurePts - 1)) * 7.6;
        pressurePos[i * 3] = x;
        pressurePos[i * 3 + 1] = 2.2;
        pressurePos[i * 3 + 2] = 0;
      }
      pressureSineGeo.setAttribute('position', new THREE.BufferAttribute(pressurePos, 3));
      const presMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
      pressureSineLine = new THREE.Line(pressureSineGeo, presMat);
      modelRoot.add(pressureSineLine);
    }

    // Model 14: MAGNETIC FIELD EXPLORER: Concentric circular field lines around wire & flux pulses
    const wireFieldGroup = new THREE.Group();
    modelRoot.add(wireFieldGroup);
    let wireFluxPoints: THREE.Points | null = null;
    let wireFluxGeo: THREE.BufferGeometry | null = null;
    const numWireFlux = 36;
    const wireFluxPos = new Float32Array(numWireFlux * 3);
    const wireFluxAngles: number[] = [];

    if (modelSpec.functionalType === 'magnetic-field-explorer') {
      const wireRadii = [1.2, 2.0, 2.8];
      const wireLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
      wireRadii.forEach((r) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)));
        }
        wireFieldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireLineMat));
      });

      wireFluxGeo = new THREE.BufferGeometry();
      wireFluxGeo.setAttribute('position', new THREE.BufferAttribute(wireFluxPos, 3));
      const fluxMat = new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.1, transparent: true, opacity: 0.9 });
      wireFluxPoints = new THREE.Points(wireFluxGeo, fluxMat);
      wireFieldGroup.add(wireFluxPoints);
      for (let i = 0; i < numWireFlux; i++) {
        wireFluxAngles.push((i / numWireFlux) * Math.PI * 2);
      }
    }

    // Model 16: INTERACTIVE ATOM: Orbiting electrons group & quantum probability cloud
    const atomAuxGroup = new THREE.Group();
    modelRoot.add(atomAuxGroup);
    const electronMeshes: THREE.Mesh[] = [];
    let orbitalCloudPoints: THREE.Points | null = null;

    if (modelSpec.functionalType === 'interactive-atom') {
      const eGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const eMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
      });
      for (let i = 0; i < 11; i++) {
        const eMesh = new THREE.Mesh(eGeo, eMat);
        atomAuxGroup.add(eMesh);
        electronMeshes.push(eMesh);
      }

      const cloudGeo = new THREE.BufferGeometry();
      const cloudPos = new Float32Array(200 * 3);
      for (let i = 0; i < 200; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.pow(Math.random(), 0.5) * 2.8;
        cloudPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        cloudPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        cloudPos[i * 3 + 2] = r * Math.cos(phi);
      }
      cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
      const cloudMat = new THREE.PointsMaterial({
        color: 0xa855f7,
        size: 0.08,
        transparent: true,
        opacity: 0.5,
      });
      orbitalCloudPoints = new THREE.Points(cloudGeo, cloudMat);
      atomAuxGroup.add(orbitalCloudPoints);
    }

    // Model 7: NEWTON'S CRADLE: Suspension Strings, Upright Pillars & Shockwave Indicators
    const cradleAuxGroup = new THREE.Group();
    modelRoot.add(cradleAuxGroup);
    const cradleStrings: THREE.Line[] = [];
    const cradleShockwaves: THREE.Mesh[] = [];

    if (modelSpec.functionalType === 'newtons-cradle' || modelSpec.id.includes('cradle')) {
      // 1. Four corner upright pillars connecting the walnut base to the chromium suspension rails
      const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 16);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.85,
        roughness: 0.15,
      });
      const pillarPositions: [number, number, number][] = [
        [-2.05, 0.2, 1.1],
        [2.05, 0.2, 1.1],
        [-2.05, 0.2, -1.1],
        [2.05, 0.2, -1.1],
      ];
      pillarPositions.forEach(([px, py, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, py, pz);
        cradleAuxGroup.add(pillar);
      });

      // 2. 10 Bifilar suspension strings (2 for each of the 5 balls)
      const stringMat = new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.85,
      });
      for (let i = 0; i < 5; i++) {
        const x0 = (i - 2) * 0.70;
        // String A (Front Rail +Z = 1.1)
        const lineGeoA = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x0, 1.6, 1.1),
          new THREE.Vector3(x0, 0, 0),
        ]);
        const lineA = new THREE.Line(lineGeoA, stringMat);
        cradleAuxGroup.add(lineA);
        cradleStrings.push(lineA);

        // String B (Rear Rail -Z = -1.1)
        const lineGeoB = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x0, 1.6, -1.1),
          new THREE.Vector3(x0, 0, 0),
        ]);
        const lineB = new THREE.Line(lineGeoB, stringMat);
        cradleAuxGroup.add(lineB);
        cradleStrings.push(lineB);
      }

      // 3. Acoustic shockwave indicators at the 4 contact interfaces
      const ringGeo = new THREE.TorusGeometry(0.36, 0.02, 12, 32);
      for (let i = 0; i < 4; i++) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.0,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set((i - 1.5) * 0.70, 0, 0);
        cradleAuxGroup.add(ring);
        cradleShockwaves.push(ring);
      }
    }

    // Model 17: BONDING EXPLORER: Dynamic Bohr Shells, Electron Transfer, Covalent Sharing, and FCC Lattice
    const bondingAuxGroup = new THREE.Group();
    modelRoot.add(bondingAuxGroup);

    // Subgroups for specialized bonding representations
    const bondingBohrShellsGroup = new THREE.Group();
    const bondingElectronsGroup = new THREE.Group();
    const bondingAtomsGroup = new THREE.Group();
    const bondingBondsGroup = new THREE.Group();
    const bondingLatticeGroup = new THREE.Group();
    bondingAuxGroup.add(
      bondingBohrShellsGroup,
      bondingElectronsGroup,
      bondingAtomsGroup,
      bondingBondsGroup,
      bondingLatticeGroup
    );

    // Electron meshes pool for bonding representations (up to 16 electrons)
    const bondingElectronMeshes: THREE.Mesh[] = [];
    const bondingBohrRingLines: THREE.Line[] = [];
    const bondingCovalentBondMeshes: THREE.Mesh[] = [];
    const bondingPeripheralAtomMeshes: THREE.Mesh[] = [];

    if (modelSpec.functionalType === 'bonding-explorer') {
      // 1. Pre-instantiate electron spheres with glowing cyan/amber materials
      const eGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const eMatCyan = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.95,
        roughness: 0.2,
      });
      const eMatGold = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.95,
        roughness: 0.2,
      });
      for (let i = 0; i < 16; i++) {
        // First electron is the designated transfer electron (colored gold for high contrast)
        const mesh = new THREE.Mesh(eGeo, i === 0 ? eMatGold : eMatCyan.clone());
        mesh.visible = false;
        bondingElectronsGroup.add(mesh);
        bondingElectronMeshes.push(mesh);
      }

      // 2. Pre-instantiate concentric Bohr shell rings (up to 6 rings: 3 on left, 3 on right)
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.45,
      });
      const ringRadii = [0.8, 1.25, 1.7];
      for (let side = 0; side < 2; side++) {
        ringRadii.forEach((r) => {
          const pts: THREE.Vector3[] = [];
          for (let k = 0; k <= 64; k++) {
            const ang = (k / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(r * Math.cos(ang), r * Math.sin(ang), 0));
          }
          const ringLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
          ringLine.visible = false;
          bondingBohrShellsGroup.add(ringLine);
          bondingBohrRingLines.push(ringLine);
        });
      }

      // 3. Pre-instantiate 4 peripheral Hydrogen atoms for H2O and CH4
      const hGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const hMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
        metalness: 0.1,
      });
      for (let i = 0; i < 4; i++) {
        const hMesh = new THREE.Mesh(hGeo, hMat);
        hMesh.visible = false;
        bondingAtomsGroup.add(hMesh);
        bondingPeripheralAtomMeshes.push(hMesh);
      }

      // 4. Pre-instantiate covalent bond cylinder tubes
      const bondCylGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16);
      const bondCylMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.75,
      });
      for (let i = 0; i < 4; i++) {
        const bMesh = new THREE.Mesh(bondCylGeo, bondCylMat);
        bMesh.visible = false;
        bondingBondsGroup.add(bMesh);
        bondingCovalentBondMeshes.push(bMesh);
      }

      // 5. 3D FCC Rock Salt Unit Cell framework (for NaCl lattice view)
      const latticePoints: THREE.Vector3[] = [];
      const s = 1.4;
      for (const dx of [-s, s]) {
        for (const dy of [-s, s]) {
          latticePoints.push(new THREE.Vector3(dx, dy, -s), new THREE.Vector3(dx, dy, s));
        }
      }
      for (const dx of [-s, s]) {
        for (const dz of [-s, s]) {
          latticePoints.push(new THREE.Vector3(dx, -s, dz), new THREE.Vector3(dx, s, dz));
        }
      }
      for (const dy of [-s, s]) {
        for (const dz of [-s, s]) {
          latticePoints.push(new THREE.Vector3(-s, dy, dz), new THREE.Vector3(s, dy, dz));
        }
      }
      const latGeo = new THREE.BufferGeometry().setFromPoints(latticePoints);
      const latMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });
      bondingLatticeGroup.add(new THREE.LineSegments(latGeo, latMat));
    }

    // Model 18: WATER MOLECULE: Multi-molecule hydrogen bonding cluster
    const waterClusterGroup = new THREE.Group();
    modelRoot.add(waterClusterGroup);
    if (modelSpec.functionalType === 'water-molecule-detailed') {
      const clusterOffsets = [
        new THREE.Vector3(-2.8, 1.8, 0.4),
        new THREE.Vector3(2.8, 1.8, -0.4),
        new THREE.Vector3(-2.2, -2.2, 0.5),
        new THREE.Vector3(2.2, -2.2, -0.5),
      ];
      const oGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const hGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const oMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const hBondMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.2, gapSize: 0.1 });

      clusterOffsets.forEach((pos) => {
        const molGroup = new THREE.Group();
        molGroup.position.copy(pos);
        molGroup.add(new THREE.Mesh(oGeo, oMat));
        const h1 = new THREE.Mesh(hGeo, hMat);
        h1.position.set(-0.7, -0.4, 0);
        const h2 = new THREE.Mesh(hGeo, hMat);
        h2.position.set(0.7, -0.4, 0);
        molGroup.add(h1, h2);
        waterClusterGroup.add(molGroup);

        const hLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.3, 0),
          pos,
        ]);
        const hLine = new THREE.Line(hLineGeo, hBondMat);
        hLine.computeLineDistances();
        waterClusterGroup.add(hLine);
      });
    }

    // Model 19: CO2 MOLECULE: Gas phase collection
    const co2GasGroup = new THREE.Group();
    modelRoot.add(co2GasGroup);
    if (modelSpec.functionalType === 'carbon-dioxide-explorer') {
      const cGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const oxGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 12);
      bondGeo.rotateZ(Math.PI / 2);
      const cMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35 });
      const oxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const bondMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.25 });

      for (let i = 0; i < 8; i++) {
        const mol = new THREE.Group();
        const rx = (Math.random() - 0.5) * 8.0;
        const ry = (Math.random() - 0.5) * 5.0;
        const rz = (Math.random() - 0.5) * 6.0;
        mol.position.set(rx, ry, rz);
        mol.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mol.add(new THREE.Mesh(cGeo, cMat));
        const b1 = new THREE.Mesh(bondGeo, bondMat);
        b1.position.set(0, 0.1, 0);
        const b2 = new THREE.Mesh(bondGeo, bondMat);
        b2.position.set(0, -0.1, 0);
        const oL = new THREE.Mesh(oxGeo, oxMat);
        oL.position.set(-1.0, 0, 0);
        const oR = new THREE.Mesh(oxGeo, oxMat);
        oR.position.set(1.0, 0, 0);
        mol.add(b1, b2, oL, oR);
        co2GasGroup.add(mol);
      }
    }

    // Model 36: HEAT TRANSFER EXPLORER: Segmented Conduction Bar, Buoyant Convection Loop, and Radiation Wavefronts
    const heatAuxGroup = new THREE.Group();
    modelRoot.add(heatAuxGroup);
    const heatRodSegments: THREE.Mesh[] = [];
    const heatProbeBeads: THREE.Mesh[] = [];
    const heatConvectionTracers: THREE.Mesh[] = [];
    const heatRadiationWaves: THREE.Mesh[] = [];
    let heatFluxArrow: THREE.ArrowHelper | null = null;
    let heatGapLine: THREE.Line | null = null;

    if (modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer') {
      // 1. Conduction bar spatial discretization: 12 discrete thermal segments along the 3.8m rod
      // Center of rod is at [0, 0.2, -1.0], spanning x = -1.9 to +1.9
      const segWidth = 3.8 / 12; // ~0.3166
      const segGeo = new THREE.CylinderGeometry(0.18, 0.18, segWidth * 0.94, 24);
      for (let i = 0; i < 12; i++) {
        const segMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35,
          metalness: 0.65,
        });
        const segMesh = new THREE.Mesh(segGeo, segMat);
        segMesh.rotation.z = Math.PI / 2;
        const xPos = -1.9 + (i + 0.5) * segWidth;
        segMesh.position.set(xPos, 0.2, -1.0);
        heatAuxGroup.add(segMesh);
        heatRodSegments.push(segMesh);
      }

      // 2. Thermometer probe needles and indicator beads at 5 locations along the rod:
      // Nodes 0, 3, 6, 9, 11
      const probeIndices = [0, 3, 6, 9, 11];
      const needleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
      const needleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const beadGeo = new THREE.SphereGeometry(0.065, 16, 16);
      probeIndices.forEach((idx) => {
        const xPos = -1.9 + (idx + 0.5) * segWidth;
        // Needle
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.position.set(xPos, 0.42, -1.0);
        heatAuxGroup.add(needle);
        // Bead
        const beadMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, emissive: 0x94a3b8, emissiveIntensity: 0.2 });
        const bead = new THREE.Mesh(beadGeo, beadMat);
        bead.position.set(xPos, 0.62, -1.0);
        heatAuxGroup.add(bead);
        heatProbeBeads.push(bead);
      });

      // 3. Directional conductive heat flux vector (q ->)
      const arrowDir = new THREE.Vector3(1, 0, 0);
      const arrowOrigin = new THREE.Vector3(-1.4, 0.75, -1.0);
      heatFluxArrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 2.8, 0xea580c, 0.3, 0.15);
      heatAuxGroup.add(heatFluxArrow);

      // 4. Convection fluid circulation tracers:
      // 16 streamline tracer spheres following two symmetric buoyancy vortex loops in the chamber
      // Chamber is at [0.2, -0.4, 0.8]
      const tracerGeo = new THREE.SphereGeometry(0.065, 14, 14);
      for (let i = 0; i < 16; i++) {
        const tracerMat = new THREE.MeshStandardMaterial({
          color: 0xea580c,
          emissive: 0xea580c,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
        heatAuxGroup.add(tracerMesh);
        heatConvectionTracers.push(tracerMesh);
      }

      // 5. Thermal Radiation electromagnetic wavefront arcs:
      // 5 concentric wavefronts propagating across empty gap between x = -1.0 and x = 1.0 at z = 1.0
      const waveArcGeo = new THREE.TorusGeometry(0.65, 0.02, 12, 32, Math.PI * 0.7);
      for (let i = 0; i < 5; i++) {
        const waveMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.0,
        });
        const waveMesh = new THREE.Mesh(waveArcGeo, waveMat);
        waveMesh.rotation.y = Math.PI / 2;
        waveMesh.position.set(-1.0 + i * 0.45, 0.2, 1.0);
        heatAuxGroup.add(waveMesh);
        heatRadiationWaves.push(waveMesh);
      }

      // 6. Vacuum gap indicator line showing direct radiant energy propagation across space
      const gapGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.1, -0.65, 1.0),
        new THREE.Vector3(1.1, -0.65, 1.0),
      ]);
      const gapMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.1, gapSize: 0.08 });
      heatGapLine = new THREE.Line(gapGeo, gapMat);
      heatGapLine.computeLineDistances();
      heatAuxGroup.add(heatGapLine);
    }

    // Model 38: ELECTRIC BELL: Articulated Armature, Dual Coils, Spring Leaf, Contact Breaker, Switch, and Gong Resonator
    const bellAuxGroup = new THREE.Group();
    modelRoot.add(bellAuxGroup);
    let bellArmaturePivotGroup: THREE.Group | null = null;
    let bellHammerMesh: THREE.Mesh | null = null;
    let bellSpringMesh: THREE.Mesh | null = null;
    let bellSwitchBlade: THREE.Mesh | null = null;
    let bellGongAcousticRipple: THREE.Mesh | null = null;
    const bellMagneticFluxArcs: THREE.Line[] = [];
    let bellSparkMesh: THREE.Mesh | null = null;
    const bellCoilWireMats: THREE.MeshStandardMaterial[] = [];
    const bellWireMeshes: THREE.Mesh[] = [];

    if (modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell') {
      // Hide monolithic default parts so our articulated subassembly moves with exact kinematics
      const defArmature = meshMap.get('spring-armature-hammer');
      if (defArmature) defArmature.visible = false;
      const defCoils = meshMap.get('electromagnet-coils');
      if (defCoils) defCoils.visible = false;
      const defSpark = meshMap.get('circuit-spark-indicator');
      if (defSpark) defSpark.visible = false;
      const defSpring = meshMap.get('flat-spring-strip');
      if (defSpring) defSpring.visible = false;
      const defScrew = meshMap.get('contact-breaker-screw');
      if (defScrew) defScrew.visible = false;
      const defSwitch = meshMap.get('pushbutton-switch');
      if (defSwitch) defSwitch.visible = false;
      const defWiring = meshMap.get('circuit-copper-wiring');
      if (defWiring) defWiring.visible = false;
      const defCores = meshMap.get('iron-core-poles');
      if (defCores) defCores.visible = false;

      // 1. Dual Soft Iron Cores & Copper Coils:
      // Positioned at x = 0.75, y = 0.4, with pole faces at x = 0.20 facing LEFT toward armature
      const coilBobbinGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.15, 24);
      const coilWireMatUpper = new THREE.MeshStandardMaterial({
        color: 0xc2410c,
        roughness: 0.35,
        metalness: 0.82,
        emissive: 0x78350f,
        emissiveIntensity: 0.08,
      });
      const coilWireMatLower = coilWireMatUpper.clone();
      bellCoilWireMats.push(coilWireMatUpper, coilWireMatLower);

      const ironPoleGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.45, 20);
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        roughness: 0.25,
        metalness: 0.88,
      });

      // Upper Coil & Pole (y = 0.75)
      const upperBobbin = new THREE.Mesh(coilBobbinGeo, coilWireMatUpper);
      upperBobbin.rotation.z = Math.PI / 2;
      upperBobbin.position.set(0.75, 0.75, 0);
      const upperCore = new THREE.Mesh(ironPoleGeo, ironMat);
      upperCore.rotation.z = Math.PI / 2;
      upperCore.position.set(0.70, 0.75, 0);
      bellAuxGroup.add(upperBobbin, upperCore);

      // Lower Coil & Pole (y = 0.05)
      const lowerBobbin = new THREE.Mesh(coilBobbinGeo, coilWireMatLower);
      lowerBobbin.rotation.z = Math.PI / 2;
      lowerBobbin.position.set(0.75, 0.05, 0);
      const lowerCore = new THREE.Mesh(ironPoleGeo, ironMat);
      lowerCore.rotation.z = Math.PI / 2;
      lowerCore.position.set(0.70, 0.05, 0);
      bellAuxGroup.add(lowerBobbin, lowerCore);

      // Soft Iron Rear Yoke connecting the two cores at x = 1.35
      const yokeGeo = new THREE.BoxGeometry(0.35, 1.05, 0.35);
      const yoke = new THREE.Mesh(yokeGeo, ironMat);
      yoke.position.set(1.35, 0.4, 0);
      bellAuxGroup.add(yoke);

      // 2. Magnetic Flux Lines (bridge air gap from pole faces x = 0.20 to armature x = 0.0)
      const fluxMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.06,
        gapSize: 0.04,
        transparent: true,
        opacity: 0.75,
      });
      for (let i = 0; i < 4; i++) {
        const fy = 0.05 + i * 0.23;
        const fluxGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0.0, fy, 0),
          new THREE.Vector3(0.20, fy, 0),
        ]);
        const fluxLine = new THREE.Line(fluxGeo, fluxMat);
        fluxLine.computeLineDistances();
        fluxLine.visible = false;
        bellAuxGroup.add(fluxLine);
        bellMagneticFluxArcs.push(fluxLine);
      }

      // 3. Articulated Armature Assembly (Pivot at bottom anchor [0.0, -0.6, 0])
      bellArmaturePivotGroup = new THREE.Group();
      bellArmaturePivotGroup.position.set(0.0, -0.6, 0);
      bellAuxGroup.add(bellArmaturePivotGroup);

      // Soft iron armature bar (length 1.6, extending from y = 0 to y = 1.6)
      const armGeo = new THREE.BoxGeometry(0.2, 1.6, 0.35);
      const armMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.85,
      });
      const armatureBar = new THREE.Mesh(armGeo, armMat);
      armatureBar.position.set(0.0, 0.8, 0);
      bellArmaturePivotGroup.add(armatureBar);

      // Silver contact rivet on LEFT face of armature at y = 1.0 (world y = 0.4)
      const rivetGeo = new THREE.SphereGeometry(0.06, 14, 14);
      const rivetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95 });
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(-0.10, 1.0, 0);
      bellArmaturePivotGroup.add(rivet);

      // Slender polished steel striker rod extending horizontally from armature toward gong
      const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.35, 16);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.2 });
      const strikerRod = new THREE.Mesh(rodGeo, rodMat);
      strikerRod.rotation.z = -Math.PI / 2;
      strikerRod.position.set(0.68, 1.0, 0);
      bellArmaturePivotGroup.add(strikerRod);

      // Solid brass hammer clapper ball at striker tip
      const ballGeo = new THREE.SphereGeometry(0.18, 20, 20);
      const ballMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.85,
      });
      bellHammerMesh = new THREE.Mesh(ballGeo, ballMat);
      bellHammerMesh.position.set(1.32, 1.0, 0);
      bellArmaturePivotGroup.add(bellHammerMesh);

      // 4. Flexible Phosphor Bronze Return Spring Leaf (anchored from -0.9 to -0.6)
      const springLeafGeo = new THREE.BoxGeometry(0.08, 0.45, 0.28);
      const springLeafMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.82, roughness: 0.3 });
      bellSpringMesh = new THREE.Mesh(springLeafGeo, springLeafMat);
      bellSpringMesh.position.set(0.0, -0.82, 0);
      bellAuxGroup.add(bellSpringMesh);

      // Sturdy brass mounting bracket securing the spring at base
      const mountBracketGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
      const bracketMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.35 });
      const mountBracket = new THREE.Mesh(mountBracketGeo, bracketMat);
      mountBracket.position.set(0.0, -1.02, 0);
      bellAuxGroup.add(mountBracket);

      // 5. Contact Breaker Screw Post & Adjustable Threaded Brass Screw
      const postGeo = new THREE.BoxGeometry(0.25, 0.9, 0.35);
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.3 });
      const post = new THREE.Mesh(postGeo, brassMat);
      post.position.set(-0.55, 0.4, 0);
      bellAuxGroup.add(post);

      const screwGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.55, 16);
      const screw = new THREE.Mesh(screwGeo, brassMat);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(-0.32, 0.4, 0);
      bellAuxGroup.add(screw);

      // Knurled adjuster head on screw
      const headGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16);
      const headMesh = new THREE.Mesh(headGeo, brassMat);
      headMesh.rotation.z = Math.PI / 2;
      headMesh.position.set(-0.62, 0.4, 0);
      bellAuxGroup.add(headMesh);

      // Contact Breaker Spark Mesh (at spark gap x = -0.10, y = 0.4, z = 0)
      const sparkGeo = new THREE.SphereGeometry(0.09, 14, 14);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 });
      bellSparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
      bellSparkMesh.position.set(-0.10, 0.4, 0);
      bellAuxGroup.add(bellSparkMesh);

      // 6. Resonant Gong Bell Dome Acoustic Ripple Wave (surrounding gong at [2.0, 0.4, 0])
      const ripGeo = new THREE.TorusGeometry(1.05, 0.025, 12, 36);
      const ripMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.0 });
      bellGongAcousticRipple = new THREE.Mesh(ripGeo, ripMat);
      bellGongAcousticRipple.position.set(2.0, 0.4, 0);
      bellAuxGroup.add(bellGongAcousticRipple);

      // 7. Battery DC Power Supply at [-1.8, -1.3, 0]
      const battBodyGeo = new THREE.BoxGeometry(1.2, 0.9, 0.55);
      const battMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
      const battBody = new THREE.Mesh(battBodyGeo, battMat);
      battBody.position.set(-1.8, -1.3, 0);
      // Ruby (+) Terminal
      const termGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 12);
      const posTermMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const posTerm = new THREE.Mesh(termGeo, posTermMat);
      posTerm.position.set(-2.1, -0.75, 0);
      // Dark Slate (-) Terminal
      const negTermMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const negTerm = new THREE.Mesh(termGeo, negTermMat);
      negTerm.position.set(-1.5, -0.75, 0);
      bellAuxGroup.add(battBody, posTerm, negTerm);

      // 8. Pushbutton / Knife Switch Assembly at [-0.3, -1.3, 0]
      const swBaseGeo = new THREE.BoxGeometry(0.9, 0.35, 0.35);
      const swBaseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const swBase = new THREE.Mesh(swBaseGeo, swBaseMat);
      swBase.position.set(-0.3, -1.35, 0);
      bellAuxGroup.add(swBase);

      // Switch Hinge and Jaw Contacts
      const contactJawGeo = new THREE.BoxGeometry(0.12, 0.18, 0.15);
      const jaw1 = new THREE.Mesh(contactJawGeo, brassMat);
      jaw1.position.set(-0.55, -1.18, 0);
      const jaw2 = new THREE.Mesh(contactJawGeo, brassMat);
      jaw2.position.set(-0.05, -1.18, 0);
      bellAuxGroup.add(jaw1, jaw2);

      // Pivoted Knife Blade
      const swBladeGeo = new THREE.BoxGeometry(0.55, 0.07, 0.10);
      const swBladeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });
      bellSwitchBlade = new THREE.Mesh(swBladeGeo, swBladeMat);
      bellSwitchBlade.geometry.translate(0.25, 0, 0); // set pivot at hinge
      bellSwitchBlade.position.set(-0.55, -1.18, 0);
      bellAuxGroup.add(bellSwitchBlade);

      // 9. Complete Circuit Wiring Bus (Connecting series loop):
      // Battery (+) -> Switch -> Coils -> Contact Post -> Contact Screw -> Armature -> Spring Base -> Battery (-)
      const wireMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        emissive: 0x78350f,
        emissiveIntensity: 0.08,
      });

      const wireRoutes = [
        // Route 1: Battery (+) to Switch Hinge
        [new THREE.Vector3(-2.1, -0.65, 0), new THREE.Vector3(-2.1, -1.18, 0), new THREE.Vector3(-0.60, -1.18, 0)],
        // Route 2: Switch Jaw to Lower Coil Terminal
        [new THREE.Vector3(0.0, -1.18, 0), new THREE.Vector3(0.35, -1.18, 0), new THREE.Vector3(0.75, -0.15, 0)],
        // Route 3: Upper Coil Terminal to Contact Post Top
        [new THREE.Vector3(0.75, 0.95, 0), new THREE.Vector3(0.15, 1.45, 0), new THREE.Vector3(-0.55, 1.45, 0), new THREE.Vector3(-0.55, 0.85, 0)],
        // Route 4: Spring Base Mount to Battery (-) Terminal
        [new THREE.Vector3(0.0, -1.15, 0), new THREE.Vector3(-0.85, -1.55, 0), new THREE.Vector3(-1.50, -1.55, 0), new THREE.Vector3(-1.50, -0.65, 0)],
      ];

      wireRoutes.forEach((pts) => {
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.025, 8, false);
        const tubeMesh = new THREE.Mesh(tubeGeo, wireMat.clone());
        bellAuxGroup.add(tubeMesh);
        bellWireMeshes.push(tubeMesh);
      });
    }

    // =========================================================================
    // BLOOD TRANSPORT — INTERNAL CIRCULATORY SYSTEM ANATOMICAL MESHES & FLOW PULSES
    // =========================================================================
    const circulatoryAuxGroup = new THREE.Group();
    modelRoot.add(circulatoryAuxGroup);
    const circulatoryVessels: { id: string; mesh: THREE.Mesh; circuit: 'pulmonary' | 'systemic'; bloodType: 'oxygenated' | 'deoxygenated'; defaultColor: number }[] = [];
    const circulatoryFlowPulses: { marker: THREE.Mesh; curve: THREE.CatmullRomCurve3; speed: number; circuit: 'pulmonary' | 'systemic'; bloodType: 'oxygenated' | 'deoxygenated'; offset: number }[] = [];

    if (modelSpec.functionalType === 'blood-transport' || modelSpec.id === 'blood-transport') {
      // 1. Hide default monolithic cylinders so our continuous smooth anatomical vascular tubes render cleanly
      const partsToSmooth = [
        'aorta-arch',
        'aorta-descending',
        'carotid-arteries',
        'subclavian-arteries',
        'renal-arteries',
        'iliac-femoral-arteries',
        'pulmonary-trunk-artery',
        'pulmonary-veins-pairs',
        'superior-vena-cava',
        'inferior-vena-cava',
        'jugular-veins',
        'subclavian-veins',
        'renal-veins',
        'iliac-femoral-veins',
        'directional-marker-pulmonary-art',
        'directional-marker-pulmonary-vein',
        'directional-marker-systemic-aorta',
        'directional-marker-systemic-vena-cava',
      ];
      partsToSmooth.forEach((id) => {
        const mesh = meshMap.get(id);
        if (mesh) mesh.visible = false;
      });

      // PBR Materials
      const arterialMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.35,
        metalness: 0.25,
      });
      const arterialDarkMat = new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        roughness: 0.35,
        metalness: 0.25,
      });
      const pulmonaryArteryMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.35,
        metalness: 0.25,
      });
      const pulmonaryVeinMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        roughness: 0.35,
        metalness: 0.25,
      });
      const venousMat = new THREE.MeshStandardMaterial({
        color: 0x1e40af,
        roughness: 0.38,
        metalness: 0.25,
      });
      const venousDeepMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.38,
        metalness: 0.25,
      });

      // Aorta (Systemic Artery - Oxygen-Rich Scarlet Red)
      const aortaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.35, 0.0, 0.1),
        new THREE.Vector3(0.25, 0.9, 0.05),
        new THREE.Vector3(0.0, 1.6, -0.1),
        new THREE.Vector3(-0.05, 1.3, -0.2),
        new THREE.Vector3(0.05, 0.0, -0.18),
        new THREE.Vector3(0.05, -1.8, -0.15),
        new THREE.Vector3(0.05, -3.2, -0.15),
      ]);
      const aortaMesh = new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 40, 0.16, 12, false), arterialMat);
      circulatoryAuxGroup.add(aortaMesh);
      circulatoryVessels.push({ id: 'aorta', mesh: aortaMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xdc2626 });

      // Carotids (Head/Brain Branches - Oxygen-Rich)
      const leftCarotid = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, 1.55, -0.05),
        new THREE.Vector3(0.35, 2.5, 0.0),
        new THREE.Vector3(0.25, 3.6, 0.0),
      ]);
      const leftCarotidMesh = new THREE.Mesh(new THREE.TubeGeometry(leftCarotid, 20, 0.08, 10, false), arterialMat);
      circulatoryAuxGroup.add(leftCarotidMesh);
      circulatoryVessels.push({ id: 'carotid-left', mesh: leftCarotidMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xdc2626 });

      const rightCarotid = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 1.55, -0.05),
        new THREE.Vector3(-0.35, 2.5, 0.0),
        new THREE.Vector3(-0.25, 3.6, 0.0),
      ]);
      const rightCarotidMesh = new THREE.Mesh(new THREE.TubeGeometry(rightCarotid, 20, 0.08, 10, false), arterialMat);
      circulatoryAuxGroup.add(rightCarotidMesh);
      circulatoryVessels.push({ id: 'carotid-right', mesh: rightCarotidMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xdc2626 });

      // Subclavian Arteries (Arm Branches - Oxygen-Rich)
      const leftSubclavian = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, 1.45, -0.05),
        new THREE.Vector3(1.1, 1.35, 0.0),
        new THREE.Vector3(2.2, 1.15, 0.0),
      ]);
      const leftSubclavianMesh = new THREE.Mesh(new THREE.TubeGeometry(leftSubclavian, 20, 0.09, 10, false), arterialMat);
      circulatoryAuxGroup.add(leftSubclavianMesh);
      circulatoryVessels.push({ id: 'subclavian-art-left', mesh: leftSubclavianMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xdc2626 });

      const rightSubclavian = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2, 1.45, -0.05),
        new THREE.Vector3(-1.1, 1.35, 0.0),
        new THREE.Vector3(-2.2, 1.15, 0.0),
      ]);
      const rightSubclavianMesh = new THREE.Mesh(new THREE.TubeGeometry(rightSubclavian, 20, 0.09, 10, false), arterialMat);
      circulatoryAuxGroup.add(rightSubclavianMesh);
      circulatoryVessels.push({ id: 'subclavian-art-right', mesh: rightSubclavianMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xdc2626 });

      // Renal Arteries (Oxygen-Rich)
      const leftRenalArt = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, -1.2, -0.15),
        new THREE.Vector3(0.8, -1.25, -0.05),
      ]);
      const leftRenalMesh = new THREE.Mesh(new THREE.TubeGeometry(leftRenalArt, 10, 0.07, 10, false), arterialDarkMat);
      circulatoryAuxGroup.add(leftRenalMesh);
      circulatoryVessels.push({ id: 'renal-art-left', mesh: leftRenalMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xb91c1c });

      const rightRenalArt = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, -1.2, -0.15),
        new THREE.Vector3(-0.8, -1.25, -0.05),
      ]);
      const rightRenalMesh = new THREE.Mesh(new THREE.TubeGeometry(rightRenalArt, 10, 0.07, 10, false), arterialDarkMat);
      circulatoryAuxGroup.add(rightRenalMesh);
      circulatoryVessels.push({ id: 'renal-art-right', mesh: rightRenalMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xb91c1c });

      // Iliac and Femoral Arteries (Oxygen-Rich to Lower Limbs)
      const leftFemoral = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, -3.2, -0.15),
        new THREE.Vector3(0.45, -4.0, 0.0),
        new THREE.Vector3(0.65, -5.2, 0.0),
      ]);
      const leftFemoralMesh = new THREE.Mesh(new THREE.TubeGeometry(leftFemoral, 20, 0.10, 10, false), arterialDarkMat);
      circulatoryAuxGroup.add(leftFemoralMesh);
      circulatoryVessels.push({ id: 'femoral-art-left', mesh: leftFemoralMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xb91c1c });

      const rightFemoral = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, -3.2, -0.15),
        new THREE.Vector3(-0.45, -4.0, 0.0),
        new THREE.Vector3(-0.65, -5.2, 0.0),
      ]);
      const rightFemoralMesh = new THREE.Mesh(new THREE.TubeGeometry(rightFemoral, 20, 0.10, 10, false), arterialDarkMat);
      circulatoryAuxGroup.add(rightFemoralMesh);
      circulatoryVessels.push({ id: 'femoral-art-right', mesh: rightFemoralMesh, circuit: 'systemic', bloodType: 'oxygenated', defaultColor: 0xb91c1c });

      // Pulmonary Trunk and Pulmonary Arteries (OXYGEN-POOR / BLUE to LUNGS)
      const pulmonaryTrunk = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0.0, 0.25),
        new THREE.Vector3(-0.35, 0.6, 0.25),
        new THREE.Vector3(-0.15, 1.05, 0.2),
      ]);
      const pulmonaryTrunkMesh = new THREE.Mesh(new THREE.TubeGeometry(pulmonaryTrunk, 20, 0.14, 10, false), pulmonaryArteryMat);
      circulatoryAuxGroup.add(pulmonaryTrunkMesh);
      circulatoryVessels.push({ id: 'pulmonary-trunk', mesh: pulmonaryTrunkMesh, circuit: 'pulmonary', bloodType: 'deoxygenated', defaultColor: 0x1d4ed8 });

      const leftPulmonaryArt = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 1.05, 0.2),
        new THREE.Vector3(0.7, 0.75, -0.1),
        new THREE.Vector3(1.7, 0.45, -0.3),
      ]);
      const leftPulmonaryArtMesh = new THREE.Mesh(new THREE.TubeGeometry(leftPulmonaryArt, 20, 0.11, 10, false), pulmonaryArteryMat);
      circulatoryAuxGroup.add(leftPulmonaryArtMesh);
      circulatoryVessels.push({ id: 'pulmonary-art-left', mesh: leftPulmonaryArtMesh, circuit: 'pulmonary', bloodType: 'deoxygenated', defaultColor: 0x1d4ed8 });

      const rightPulmonaryArt = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 1.05, 0.2),
        new THREE.Vector3(-0.8, 0.75, -0.1),
        new THREE.Vector3(-1.7, 0.45, -0.3),
      ]);
      const rightPulmonaryArtMesh = new THREE.Mesh(new THREE.TubeGeometry(rightPulmonaryArt, 20, 0.11, 10, false), pulmonaryArteryMat);
      circulatoryAuxGroup.add(rightPulmonaryArtMesh);
      circulatoryVessels.push({ id: 'pulmonary-art-right', mesh: rightPulmonaryArtMesh, circuit: 'pulmonary', bloodType: 'deoxygenated', defaultColor: 0x1d4ed8 });

      // Pulmonary Veins (OXYGEN-RICH / SCARLET RED RETURNING from LUNGS to Left Atrium)
      const leftPulmonaryVeins = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.7, 0.35, -0.3),
        new THREE.Vector3(1.1, 0.55, -0.2),
        new THREE.Vector3(0.65, 0.65, -0.15),
      ]);
      const leftPulmonaryVeinsMesh = new THREE.Mesh(new THREE.TubeGeometry(leftPulmonaryVeins, 20, 0.10, 10, false), pulmonaryVeinMat);
      circulatoryAuxGroup.add(leftPulmonaryVeinsMesh);
      circulatoryVessels.push({ id: 'pulmonary-veins-left', mesh: leftPulmonaryVeinsMesh, circuit: 'pulmonary', bloodType: 'oxygenated', defaultColor: 0xf43f5e });

      const rightPulmonaryVeins = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.7, 0.35, -0.3),
        new THREE.Vector3(-0.3, 0.55, -0.25),
        new THREE.Vector3(0.65, 0.65, -0.15),
      ]);
      const rightPulmonaryVeinsMesh = new THREE.Mesh(new THREE.TubeGeometry(rightPulmonaryVeins, 20, 0.10, 10, false), pulmonaryVeinMat);
      circulatoryAuxGroup.add(rightPulmonaryVeinsMesh);
      circulatoryVessels.push({ id: 'pulmonary-veins-right', mesh: rightPulmonaryVeinsMesh, circuit: 'pulmonary', bloodType: 'oxygenated', defaultColor: 0xf43f5e });

      // Superior Vena Cava (SVC) and Tributaries (Deoxygenated Return from Upper Body)
      const svcCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.65, 2.0, 0.05),
        new THREE.Vector3(-0.85, 1.4, 0.08),
        new THREE.Vector3(-0.85, 0.8, 0.1),
      ]);
      const svcMesh = new THREE.Mesh(new THREE.TubeGeometry(svcCurve, 20, 0.15, 10, false), venousMat);
      circulatoryAuxGroup.add(svcMesh);
      circulatoryVessels.push({ id: 'svc', mesh: svcMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e40af });

      // Jugular Veins
      const leftJugular = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, 3.6, 0.0),
        new THREE.Vector3(-0.25, 2.6, 0.05),
        new THREE.Vector3(-0.65, 2.0, 0.05),
      ]);
      const leftJugularMesh = new THREE.Mesh(new THREE.TubeGeometry(leftJugular, 20, 0.09, 10, false), venousMat);
      circulatoryAuxGroup.add(leftJugularMesh);
      circulatoryVessels.push({ id: 'jugular-left', mesh: leftJugularMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e40af });

      const rightJugular = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 3.6, 0.0),
        new THREE.Vector3(-0.55, 2.6, 0.05),
        new THREE.Vector3(-0.65, 2.0, 0.05),
      ]);
      const rightJugularMesh = new THREE.Mesh(new THREE.TubeGeometry(rightJugular, 20, 0.09, 10, false), venousMat);
      circulatoryAuxGroup.add(rightJugularMesh);
      circulatoryVessels.push({ id: 'jugular-right', mesh: rightJugularMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e40af });

      // Subclavian Veins
      const leftSubclavianVein = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.2, 1.05, 0.0),
        new THREE.Vector3(0.8, 1.25, 0.0),
        new THREE.Vector3(-0.65, 2.0, 0.05),
      ]);
      const leftSubclavianVeinMesh = new THREE.Mesh(new THREE.TubeGeometry(leftSubclavianVein, 20, 0.09, 10, false), venousMat);
      circulatoryAuxGroup.add(leftSubclavianVeinMesh);
      circulatoryVessels.push({ id: 'subclavian-vein-left', mesh: leftSubclavianVeinMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e40af });

      const rightSubclavianVein = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.2, 1.05, 0.0),
        new THREE.Vector3(-1.3, 1.25, 0.0),
        new THREE.Vector3(-0.65, 2.0, 0.05),
      ]);
      const rightSubclavianVeinMesh = new THREE.Mesh(new THREE.TubeGeometry(rightSubclavianVein, 20, 0.09, 10, false), venousMat);
      circulatoryAuxGroup.add(rightSubclavianVeinMesh);
      circulatoryVessels.push({ id: 'subclavian-vein-right', mesh: rightSubclavianVeinMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e40af });

      // Inferior Vena Cava (IVC) and Lower Tributaries
      const ivcCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.35, -3.2, 0.0),
        new THREE.Vector3(-0.55, -1.8, 0.0),
        new THREE.Vector3(-0.75, -0.6, 0.05),
        new THREE.Vector3(-0.85, 0.4, 0.1),
      ]);
      const ivcMesh = new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 30, 0.16, 10, false), venousDeepMat);
      circulatoryAuxGroup.add(ivcMesh);
      circulatoryVessels.push({ id: 'ivc', mesh: ivcMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e3a8a });

      // Femoral Veins (Lower Limbs)
      const leftFemoralVein = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, -5.2, 0.0),
        new THREE.Vector3(0.25, -4.0, 0.0),
        new THREE.Vector3(-0.35, -3.2, 0.0),
      ]);
      const leftFemoralVeinMesh = new THREE.Mesh(new THREE.TubeGeometry(leftFemoralVein, 20, 0.10, 10, false), venousDeepMat);
      circulatoryAuxGroup.add(leftFemoralVeinMesh);
      circulatoryVessels.push({ id: 'femoral-vein-left', mesh: leftFemoralVeinMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e3a8a });

      const rightFemoralVein = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.55, -5.2, 0.0),
        new THREE.Vector3(-0.45, -4.0, 0.0),
        new THREE.Vector3(-0.35, -3.2, 0.0),
      ]);
      const rightFemoralVeinMesh = new THREE.Mesh(new THREE.TubeGeometry(rightFemoralVein, 20, 0.10, 10, false), venousDeepMat);
      circulatoryAuxGroup.add(rightFemoralVeinMesh);
      circulatoryVessels.push({ id: 'femoral-vein-right', mesh: rightFemoralVeinMesh, circuit: 'systemic', bloodType: 'deoxygenated', defaultColor: 0x1e3a8a });

      // Directional Flow Pulse Markers Setup
      const addFlowPulses = (
        curve: THREE.CatmullRomCurve3,
        circuit: 'pulmonary' | 'systemic',
        bloodType: 'oxygenated' | 'deoxygenated',
        count: number,
        speed: number,
        colorHex: number
      ) => {
        const markerGeo = new THREE.ConeGeometry(0.12, 0.28, 12);
        markerGeo.rotateX(Math.PI / 2);
        for (let i = 0; i < count; i++) {
          const markerMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.9,
          });
          const markerMesh = new THREE.Mesh(markerGeo, markerMat);
          circulatoryAuxGroup.add(markerMesh);
          circulatoryFlowPulses.push({
            marker: markerMesh,
            curve,
            speed,
            circuit,
            bloodType,
            offset: i / count,
          });
        }
      };

      // 1. Pulmonary Circulation Flow:
      // (a) Right Ventricle -> Pulmonary Arteries -> Lungs (AWAY FROM HEART, DEOXYGENATED BLUE)
      addFlowPulses(pulmonaryTrunk, 'pulmonary', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(leftPulmonaryArt, 'pulmonary', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(rightPulmonaryArt, 'pulmonary', 'deoxygenated', 2, 0.6, 0x60a5fa);

      // (b) Lungs -> Pulmonary Veins -> Left Atrium (TOWARD HEART, OXYGENATED SCARLET)
      addFlowPulses(leftPulmonaryVeins, 'pulmonary', 'oxygenated', 2, 0.6, 0xf87171);
      addFlowPulses(rightPulmonaryVeins, 'pulmonary', 'oxygenated', 2, 0.6, 0xf87171);

      // 2. Systemic Circulation Flow:
      // (a) Left Ventricle -> Aorta & Branches -> Organs (AWAY FROM HEART, OXYGENATED SCARLET)
      addFlowPulses(aortaCurve, 'systemic', 'oxygenated', 4, 0.7, 0xf87171);
      addFlowPulses(leftCarotid, 'systemic', 'oxygenated', 2, 0.7, 0xf87171);
      addFlowPulses(rightCarotid, 'systemic', 'oxygenated', 2, 0.7, 0xf87171);
      addFlowPulses(leftSubclavian, 'systemic', 'oxygenated', 2, 0.7, 0xf87171);
      addFlowPulses(leftFemoral, 'systemic', 'oxygenated', 2, 0.7, 0xf87171);
      addFlowPulses(rightFemoral, 'systemic', 'oxygenated', 2, 0.7, 0xf87171);

      // (b) Organs -> Venae Cavae -> Right Atrium (TOWARD HEART, DEOXYGENATED BLUE)
      addFlowPulses(svcCurve, 'systemic', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(leftJugular, 'systemic', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(leftSubclavianVein, 'systemic', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(ivcCurve, 'systemic', 'deoxygenated', 3, 0.6, 0x60a5fa);
      addFlowPulses(leftFemoralVein, 'systemic', 'deoxygenated', 2, 0.6, 0x60a5fa);
      addFlowPulses(rightFemoralVein, 'systemic', 'deoxygenated', 2, 0.6, 0x60a5fa);
    }

    // Raycasting pointer & touch event detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownPosRef.current) return;
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
      pointerDownPosRef.current = null;

      // Treat as a selection click/tap if pointer didn't drag/orbit (> 8px)
      if (dx < 8 && dy < 8) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          let hitPart: ModelPartSpec | undefined = hitObj?.userData?.partSpec;
          while (!hitPart && hitObj?.parent) {
            hitObj = hitObj.parent;
            hitPart = hitObj?.userData?.partSpec;
          }
          if (hitPart) {
            setIsExplorePartsActive(true);
            handleSelectPart(hitPart);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // -------------------------------------------------------------
    // ANIMATION & PHYSICAL SIMULATION LOOP
    // -------------------------------------------------------------
    let lastTime = performance.now();
    let simTime = 0;
    let motorSpeed = 0;
    let pendulumAngle = ((parameters.initialAngle ?? 30) * Math.PI) / 180;
    let pendulumOmega = 0;
    let leverAngle = 0;
    let lastHandledResetTrigger = resetSimTriggerRef.current;

    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const parameters = parametersRef.current;
      const conditions = conditionsRef.current;
      const isPlaying = isPlayingRef.current;
      const showLabels = showLabelsRef.current;
      const showGrid = showGridRef.current;
      const showAxes = showAxesRef.current;

      // Handle synchronous simulation & transform reset when Retry/Reset is clicked
      if (lastHandledResetTrigger !== resetSimTriggerRef.current) {
        lastHandledResetTrigger = resetSimTriggerRef.current;
        simTime = 0;
        motorSpeed = 0;
        pendulumAngle = ((parameters.initialAngle ?? modelSpec.parameters?.initialAngle?.defaultValue ?? 30) * Math.PI) / 180;
        pendulumOmega = 0;
        leverAngle = 0;
        rotorGroup.rotation.set(0, 0, 0);

        meshMap.forEach((mesh) => {
          const u = mesh.userData;
          if (u?.basePosition) mesh.position.copy(u.basePosition);
          if (u?.baseRotation) mesh.rotation.copy(u.baseRotation);
          if (u?.baseScale) mesh.scale.copy(u.baseScale);
          if (u?.baseVisible !== undefined) mesh.visible = u.baseVisible;
        });

        targetCameraPosRef.current = null;
        targetLookAtRef.current = null;
        controls.reset();
      }

      grid.visible = showGrid;
      axes.visible = showAxes;

      // Exploded View Assembly / Disassembly interpolation
      const isExploded = isExplodedViewRef.current;
      meshMap.forEach((mesh) => {
        const u = mesh.userData;
        if (u && u.basePosition && u.explodedPosition) {
          const target = isExploded ? u.explodedPosition : u.basePosition;
          if (!mesh.userData.partSpec?.animation || mesh.userData.partSpec.animation.type !== 'orbit') {
            mesh.position.lerp(target, 0.08);
          }
        }
      });

      // Smooth 3D camera interpolation towards close-up target when inspecting a component
      if (controls.isPointerDown) {
        // User started manual orbit/pan — release auto-focus target
        targetCameraPosRef.current = null;
        targetLookAtRef.current = null;
      } else if (targetCameraPosRef.current && targetLookAtRef.current) {
        camera.position.lerp(targetCameraPosRef.current, 0.12);
        controls.target.lerp(targetLookAtRef.current, 0.12);
        controls.syncFromCamera(camera.position, controls.target);
        if (
          camera.position.distanceTo(targetCameraPosRef.current) < 0.05 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.05
        ) {
          controls.syncFromCamera(targetCameraPosRef.current, targetLookAtRef.current);
          targetCameraPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      controls.update();

      if (isPlaying) {
        simTime += delta;

        // 1. DC Motor Assembly: Rotate only the rotor group around central axle
        if (modelSpec.functionalType === 'dc-motor-assembly') {
          const voltage = parameters.voltage ?? 12;
          const field = parameters.fieldStrength ?? 1.0;
          const isCircuitClosed = conditions.circuitClosed !== false;
          const isReversed = conditions.reversePolarity === 'reversed' || conditions.reversePolarity === true;
          const dir = isReversed ? -1 : 1;

          const targetSpeed = isCircuitClosed ? dir * (voltage / 12) * (field / 1.0) * 5.0 : 0;
          motorSpeed += (targetSpeed - motorSpeed) * (isCircuitClosed ? delta * 3 : delta * 1.5);
          rotorGroup.rotation.z += motorSpeed * delta;

          // Force vectors on active coil arms
          const forceUp = meshMap.get('force-arrow-up');
          const forceDown = meshMap.get('force-arrow-down');
          const mag = Math.min(2.0, Math.max(0.4, (voltage / 12) * (field / 1.0)));
          if (forceUp) {
            forceUp.visible = isCircuitClosed;
            forceUp.scale.set(1, isReversed ? -mag : mag, 1);
          }
          if (forceDown) {
            forceDown.visible = isCircuitClosed;
            forceDown.scale.set(1, isReversed ? -mag : mag, 1);
          }
        }

        // 2. Optical Telescope: Drawtube travel, aperture scaling, dynamic starlight refraction
        if (modelSpec.functionalType === 'optical-telescope' || modelSpec.id.includes('telescope')) {
          const fShift = ((parameters.focuserPosition ?? 25) - 25) * 0.025;
          const fTube = meshMap.get('focuser-drawtube');
          const eLens = meshMap.get('eyepiece-lens');
          const eBarrel = meshMap.get('eyepiece-barrel');
          if (fTube) fTube.position.z = -3.2 - fShift;
          if (eLens) eLens.position.z = -4.1 - fShift;
          if (eBarrel) eBarrel.position.z = -4.0 - fShift;

          const apScale = (parameters.objectiveAperture ?? 100) / 100;
          const oLens = meshMap.get('objective-lens');
          const dShield = meshMap.get('dew-shield');
          if (oLens) oLens.scale.set(apScale, apScale, 1);
          if (dShield) dShield.scale.set(apScale, apScale, 1);

          if (rayLines && rayGeo) {
            const showRays = conditions.showRayTraces !== false;
            rayLines.visible = showRays;
            if (showRays) {
              const rayPts: THREE.Vector3[] = [];
              const rRads = [-0.32, -0.16, 0, 0.16, 0.32].map((r) => r * apScale);
              const zEnt = 5.6;
              const zObj = 2.7;
              const zFoc = -0.8;
              const zEye = -4.1 - fShift;
              const mag = parameters.magnification ?? 50;
              const exitD = 0.28 / (mag / 35);
              const zExit = -5.8 - fShift;

              rRads.forEach((r) => {
                // Incoming starlight
                rayPts.push(new THREE.Vector3(r * 0.7, 0.5 + r, zEnt));
                rayPts.push(new THREE.Vector3(r * 0.7, 0.5 + r, zObj));
                // Objective refraction to intermediate focal plane (inverted!)
                rayPts.push(new THREE.Vector3(r * 0.7, 0.5 + r, zObj));
                rayPts.push(new THREE.Vector3(0, 0.5, zFoc));
                // Continuing to eyepiece
                rayPts.push(new THREE.Vector3(0, 0.5, zFoc));
                const eyeR = -r * 0.45;
                rayPts.push(new THREE.Vector3(eyeR * 0.7, 0.5 + eyeR, zEye));
                // Refracted parallel starlight exit beam (proportional to ray height r!)
                rayPts.push(new THREE.Vector3(eyeR * 0.7, 0.5 + eyeR, zEye));
                const normR = apScale > 0 ? r / (0.32 * apScale) : 0;
                const exitR = -normR * exitD;
                rayPts.push(new THREE.Vector3(exitR * 0.7, 0.5 + exitR, zExit));
              });
              rayGeo.setFromPoints(rayPts);
            }
          }
        }

      // 3. Rutherford Alpha Particle Scattering Kinetics & Continuous Multi-Ray Streams (Always running continuously for smooth ongoing streaming rays)
      if (particlePointsObj && particlePointsGeo) {
        const posAttr = particlePointsGeo.attributes.position as THREE.BufferAttribute;
        const intensity = parameters.beamIntensity ?? 60;
        const beamSpeedFactor = intensity / 60;
        const Z = parameters.goldAtomicNumber ?? 79;
        const foilThick = parameters.foilThickness ?? 200;
        const showTrajectories = conditions.showTrajectories !== false;

        // Update ray lines & beam glow with continuous flowing wave pulse animation
        if (rutherfordRayLines) {
          rutherfordRayLines.visible = showTrajectories;
          if (showTrajectories && rutherfordRayLines.material instanceof THREE.LineBasicMaterial) {
            const flowPulse = 0.7 + 0.3 * Math.sin(currentTime * 0.005);
            rutherfordRayLines.material.opacity = THREE.MathUtils.clamp((intensity / 75) * flowPulse, 0.45, 0.98);
          }
        }
        if (rutherfordBeamGlow) {
          rutherfordBeamGlow.visible = showTrajectories;
          if (rutherfordBeamGlow.material instanceof THREE.MeshBasicMaterial) {
            const glowPulse = 0.18 + 0.12 * Math.cos(currentTime * 0.006);
            rutherfordBeamGlow.material.opacity = THREE.MathUtils.clamp((intensity / 100) * glowPulse, 0.08, 0.32);
          }
        }

        rutherfordParticles.forEach((p, idx) => {
          p.z += p.vz * delta * beamSpeedFactor;
          p.x += p.vx * delta * beamSpeedFactor;
          p.y += p.vy * delta * beamSpeedFactor;
          p.age += delta;

          // Coulomb deflection near gold foil plane (z ≈ 0): cross section proportional to Z^2 * foilThickness
          if (!p.scattered && p.z <= 0.08 && p.z >= -0.15) {
            p.scattered = true;
            const rand = Math.random();
            const scatScale = Math.pow(Z / 79, 2) * (foilThick / 200);

            if (rand < 0.008 * scatScale) {
              // Large-angle backscatter (> 90 degrees) ~ 1 in 8000 scaled for visual pedagogy
              p.pathType = 'backscatter';
              const theta = Math.PI * 0.62 + Math.random() * (Math.PI * 0.32);
              const phi = Math.random() * Math.PI * 2;
              const speed = 3.9;
              p.vz = speed * Math.cos(theta);
              p.vx = speed * Math.sin(theta) * Math.cos(phi);
              p.vy = speed * Math.sin(theta) * Math.sin(phi);
            } else if (rand < 0.12 * scatScale) {
              // Moderate Coulomb deflection (20 to 65 degrees)
              p.pathType = 'moderate';
              const theta = (20 + Math.random() * 45) * (Math.PI / 180);
              const phi = Math.random() * Math.PI * 2;
              const speed = 4.1;
              p.vz = -speed * Math.cos(theta);
              p.vx = speed * Math.sin(theta) * Math.cos(phi);
              p.vy = speed * Math.sin(theta) * Math.sin(phi);
            } else if (rand < 0.38 * scatScale) {
              // Small Coulomb deflection (3 to 18 degrees)
              p.pathType = 'small';
              const theta = (3 + Math.random() * 15) * (Math.PI / 180);
              const phi = Math.random() * Math.PI * 2;
              const speed = 4.2;
              p.vz = -speed * Math.cos(theta);
              p.vx = speed * Math.sin(theta) * Math.cos(phi);
              p.vy = speed * Math.sin(theta) * Math.sin(phi);
            } else {
              // Undeviated (straight through)
              p.pathType = 'straight';
              p.vx += (Math.random() - 0.5) * 0.03 * (Z / 79);
              p.vy += (Math.random() - 0.5) * 0.03 * (Z / 79);
            }
          }

          // Impact with phosphor screen (cylindrical radius ~ 3.4) or boundary
          const currentDist = Math.hypot(p.x, p.z);
          if (currentDist >= 3.4 || Math.abs(p.z) > 4.5 || p.age > 2.6) {
            if (currentDist >= 3.25 && flashes.length < 40) {
              flashes.push({
                position: new THREE.Vector3(p.x, p.y, p.z),
                life: 0.35,
              });
            }

            // Continuous respawn in multi-channel beam bundle with staggered z
            const chan = idx % 12;
            const ang = chan * (Math.PI / 6) + (Math.random() - 0.5) * 0.25;
            const rad = 0.01 + Math.random() * 0.055;
            p.x = Math.cos(ang) * rad;
            p.y = 0.4 + Math.sin(ang) * rad;
            p.z = 4.2 + (Math.random() * 0.5);
            p.vx = 0;
            p.vy = 0;
            p.vz = -4.1;
            p.scattered = false;
            p.pathType = 'straight';
            p.age = 0;
          }

          posAttr.setXYZ(idx, p.x, p.y, p.z);
        });
        posAttr.needsUpdate = true;

        // Update scintillation flashes on phosphor screen
        if (flashMesh) {
          const dummy = new THREE.Object3D();
          for (let i = 0; i < 40; i++) {
            if (i < flashes.length) {
              const f = flashes[i];
              f.life -= delta;
              dummy.position.copy(f.position);
              const s = Math.max(0.01, f.life / 0.35);
              dummy.scale.set(s, s, s);
              dummy.updateMatrix();
              flashMesh.setMatrixAt(i, dummy.matrix);
            } else {
              dummy.position.set(0, -999, 0);
              dummy.updateMatrix();
              flashMesh.setMatrixAt(i, dummy.matrix);
            }
          }
          flashMesh.instanceMatrix.needsUpdate = true;
          for (let i = flashes.length - 1; i >= 0; i--) {
            if (flashes[i].life <= 0) flashes.splice(i, 1);
          }
        }
      }

        // 4. Pendulum Harmonic Kinematics
        if (modelSpec.functionalType === 'pendulum-harmonics' || modelSpec.id.includes('pendulum')) {
          const L = parameters.length ?? 2.0;
          const g = parameters.gravity ?? 9.81;
          const gamma = parameters.dampingFactor ?? 0.03;

          const alpha = -(g / L) * Math.sin(pendulumAngle) - gamma * pendulumOmega;
          pendulumOmega += alpha * delta;
          pendulumAngle += pendulumOmega * delta;

          const bobMesh = meshMap.get('spherical-bob');
          const stringMesh = meshMap.get('suspension-string');

          const pivotY = 1.9;
          const bobX = L * Math.sin(pendulumAngle);
          const bobY = pivotY - L * Math.cos(pendulumAngle);

          if (bobMesh) {
            bobMesh.position.set(bobX, bobY, 0);
          }
          if (stringMesh) {
            stringMesh.position.set(bobX / 2, (pivotY + bobY) / 2, 0);
            stringMesh.rotation.z = pendulumAngle;
            stringMesh.scale.y = L / 2.0;
          }

          if (velocityArrow && tensionArrow) {
            pendulumVectorGroup.visible = conditions.showVectors !== false;
            const tangentialV = pendulumOmega * L;
            const vSign = tangentialV >= 0 ? 1 : -1;
            velocityArrow.position.set(bobX, bobY, 0);
            velocityArrow.setDirection(
              new THREE.Vector3(vSign * Math.cos(pendulumAngle), vSign * Math.sin(pendulumAngle), 0).normalize()
            );
            velocityArrow.setLength(Math.max(0.08, Math.min(2.5, Math.abs(tangentialV) * 0.4)));

            tensionArrow.position.set(bobX, bobY, 0);
            tensionArrow.setDirection(new THREE.Vector3(-bobX, pivotY - bobY, 0).normalize());
            tensionArrow.setLength(1.1);
          }
        }

        // 5. Class 1 Lever: Torque Equilibrium & Dynamic Beam Rotation
        if (modelSpec.functionalType === 'class-1-lever' || modelSpec.id.includes('lever')) {
          const loadD = 2.5;
          const loadW = parameters.loadWeight ?? 50;
          const effD = parameters.effortArmLength ?? 2.5;
          const effW = 50;
          const tauLoad = loadW * 9.81 * loadD;
          const tauEff = effW * 9.81 * effD;
          const netTau = tauEff - tauLoad;
          const targetAngle = Math.max(-0.25, Math.min(0.25, -netTau * 0.00032));
          leverAngle += (targetAngle - leverAngle) * delta * 4;

          const beamMesh = meshMap.get('lever-beam');
          const loadMesh = meshMap.get('load-mass');
          const effortMesh = meshMap.get('effort-mass');

          if (beamMesh) beamMesh.rotation.z = leverAngle;
          if (loadMesh) {
            loadMesh.position.x = -loadD * Math.cos(leverAngle);
            loadMesh.position.y = -0.2 - loadD * Math.sin(leverAngle) + 0.6;
          }
          if (effortMesh) {
            effortMesh.position.x = effD * Math.cos(leverAngle);
            effortMesh.position.y = -0.2 + effD * Math.sin(leverAngle) + 0.4;
          }
        }

        // 6. Respiratory System: Diaphragmatic Inhalation/Exhalation Cycles
        if (modelSpec.functionalType === 'respiratory-system' || modelSpec.id.includes('respiratory')) {
          const f = (parameters.breathingRate ?? 14) / 60;
          const volScale = (parameters.tidalVolume ?? 500) / 500;
          const phi = Math.sin(2 * Math.PI * f * simTime);

          const diaMesh = meshMap.get('diaphragm');
          const rLung = meshMap.get('right-lung');
          const lLung = meshMap.get('left-lung');

          if (diaMesh) diaMesh.position.y = -1.4 - 0.35 * Math.max(0, phi) * volScale;
          const lungScale = 1.0 + 0.16 * Math.max(0, phi) * volScale;
          if (rLung) rLung.scale.set(lungScale, lungScale, lungScale);
          if (lLung) lLung.scale.set(lungScale, lungScale, lungScale);
        }

        // 7. Bar Magnet: Magnetic Flux Line Pulses
        if (magnetFluxPoints && magnetFluxGeo) {
          const fluxAttr = magnetFluxGeo.attributes.position as THREE.BufferAttribute;
          const fluxSpeed = (parameters.remanence ?? 1.2) * 1.8;

          for (let i = 0; i < numFluxParticles; i++) {
            const p = fluxTrajParams[i];
            p.u = (p.u + delta * fluxSpeed) % Math.PI;
            const x = 1.1 * Math.cos(p.u);
            const rPerp = p.R * Math.sin(p.u);
            const y = rPerp * Math.sin(p.phi);
            const z = rPerp * Math.cos(p.phi);
            fluxAttr.setXYZ(i, x, y, z);
          }
          fluxAttr.needsUpdate = true;
        }

        // 8. Solar System: Keplerian Planetary Revolutions for all 8 Planets + Moon
        if (modelSpec.functionalType === 'solar-system' || modelSpec.id.includes('solar')) {
          const spd = (parameters.simulationSpeed ?? 1.0) * 0.8;
          const merc = meshMap.get('mercury');
          const ven = meshMap.get('venus');
          const ear = meshMap.get('earth');
          const moon = meshMap.get('moon');
          const mar = meshMap.get('mars');
          const jup = meshMap.get('jupiter');
          const sat = meshMap.get('saturn');
          const satRings = meshMap.get('saturn-rings');
          const ura = meshMap.get('uranus');
          const nep = meshMap.get('neptune');

          if (merc) {
            const th = simTime * 4.15 * spd;
            merc.position.set(1.8 * Math.cos(th), 0, 1.8 * Math.sin(th));
          }
          if (ven) {
            const th = simTime * 1.62 * spd;
            ven.position.set(2.7 * Math.cos(th), 0, 2.7 * Math.sin(th));
          }
          if (ear) {
            const th = simTime * 1.0 * spd;
            const ex = 3.8 * Math.cos(th);
            const ez = 3.8 * Math.sin(th);
            ear.position.set(ex, 0, ez);
            if (moon) {
              const mTh = simTime * 6.5 * spd;
              moon.position.set(ex + 0.45 * Math.cos(mTh), 0.05 * Math.sin(mTh), ez + 0.45 * Math.sin(mTh));
            }
          }
          if (mar) {
            const th = simTime * 0.53 * spd;
            mar.position.set(4.9 * Math.cos(th), 0, 4.9 * Math.sin(th));
          }
          if (jup) {
            const th = simTime * 0.28 * spd;
            jup.position.set(6.3 * Math.cos(th), 0, 6.3 * Math.sin(th));
          }
          if (sat) {
            const th = simTime * 0.18 * spd;
            const sx = 7.8 * Math.cos(th);
            const sz = 7.8 * Math.sin(th);
            sat.position.set(sx, 0, sz);
            if (satRings) satRings.position.set(sx, 0, sz);
          }
          if (ura) {
            const th = simTime * 0.11 * spd;
            ura.position.set(9.2 * Math.cos(th), 0, 9.2 * Math.sin(th));
          }
          if (nep) {
            const th = simTime * 0.08 * spd;
            nep.position.set(10.6 * Math.cos(th), 0, 10.6 * Math.sin(th));
          }
        }

        // 9. Water Molecule: VSEPR Bent Angle & Infrared Harmonic Vibrations
        if (modelSpec.functionalType === 'water-molecule' || modelSpec.id.includes('water')) {
          const bondAngleDeg = parameters.bondAngle ?? 104.5;
          const halfAngle = (bondAngleDeg * Math.PI) / 360;
          const vibRate = parameters.vibrationRate ?? 1.0;
          const dR = Math.sin(simTime * vibRate * 8) * 0.05;
          const dAngle = Math.sin(simTime * vibRate * 6) * 0.04;

          const L = 1.6 + dR;
          const curHalf = halfAngle + dAngle;

          const h1 = meshMap.get('hydrogen-1');
          const h2 = meshMap.get('hydrogen-2');
          const b1 = meshMap.get('bond-1');
          const b2 = meshMap.get('bond-2');
          const lp1 = meshMap.get('lone-pair-1');
          const lp2 = meshMap.get('lone-pair-2');
          const dip = meshMap.get('dipole-vector');

          if (h1) h1.position.set(-L * Math.sin(curHalf), 0.3 - L * Math.cos(curHalf), 0);
          if (h2) h2.position.set(L * Math.sin(curHalf), 0.3 - L * Math.cos(curHalf), 0);
          if (b1) {
            b1.position.set((-L / 2) * Math.sin(curHalf), 0.3 - (L / 2) * Math.cos(curHalf), 0);
            b1.rotation.z = -curHalf;
            b1.scale.y = L / 1.6;
          }
          if (b2) {
            b2.position.set((L / 2) * Math.sin(curHalf), 0.3 - (L / 2) * Math.cos(curHalf), 0);
            b2.rotation.z = curHalf;
            b2.scale.y = L / 1.6;
          }

          if (lp1) lp1.visible = conditions.showLonePairs !== false;
          if (lp2) lp2.visible = conditions.showLonePairs !== false;
          if (dip) dip.visible = conditions.showDipole !== false;
        }

        // 10. Compound Microscope: Substage Light Cone & Revolving Nosepiece Objective Selection
        if (microscopeBeam) {
          const lMat = microscopeBeam.material as THREE.MeshBasicMaterial;
          const intensity = (parameters.lightIntensity ?? 80) / 100;
          const mag = parameters.magnification ?? 100;
          lMat.opacity = 0.2 + intensity * 0.45;
          const nosepiece = meshMap.get('nosepiece');
          if (nosepiece) {
            // Rotate turret cleanly as objective magnification increases (40x -> 100x -> 400x)
            nosepiece.rotation.y = ((mag - 40) / 360) * ((Math.PI * 2) / 3);
          }
          const stage = meshMap.get('stage');
          if (stage) {
            // Fine focus travel with higher magnification objective working distance
            stage.position.y = -0.3 + Math.min(0.18, ((mag - 40) / 360) * 0.14);
          }
        }

        // 11. Human Heart: Synchronized 4-Chamber Cardiac Pumping Cycle
        if (modelSpec.functionalType === 'human-heart' || modelSpec.id.includes('heart')) {
          const bpm = parameters.heartRateBpm ?? 72;
          const f = bpm / 60;
          const phase = (simTime * f * Math.PI * 2) % (Math.PI * 2);

          const lv = meshMap.get('left_ventricle');
          const rv = meshMap.get('right_ventricle');
          const la = meshMap.get('left_atrium');
          const ra = meshMap.get('right_atrium');
          const ao = meshMap.get('aorta');
          const pt = meshMap.get('pulmonary_trunk');

          // Phase 1: Atrial systole (0 to PI/2)
          if (phase < Math.PI * 0.5) {
            const atriaScale = 1.0 - 0.12 * Math.sin(phase * 2);
            if (la) la.scale.set(atriaScale, atriaScale, atriaScale);
            if (ra) ra.scale.set(atriaScale, atriaScale, atriaScale);
          } else if (phase < Math.PI * 1.3) {
            // Phase 2: Ventricular systole (ejection)
            const ventScale = 1.0 - 0.14 * Math.sin((phase - Math.PI * 0.5) * 1.25);
            if (lv) lv.scale.set(ventScale, ventScale, ventScale);
            if (rv) rv.scale.set(ventScale, ventScale, ventScale);
            if (ao) ao.scale.set(1.05, 1.05, 1.05);
            if (pt) pt.scale.set(1.05, 1.05, 1.05);
          } else {
            // Phase 3: Diastole (refill)
            if (lv) lv.scale.set(1.0, 1.0, 1.0);
            if (rv) rv.scale.set(1.0, 1.0, 1.0);
            if (la) la.scale.set(1.0, 1.0, 1.0);
            if (ra) ra.scale.set(1.0, 1.0, 1.0);
            if (ao) ao.scale.set(1.0, 1.0, 1.0);
            if (pt) pt.scale.set(1.0, 1.0, 1.0);
          }
        }

        // 12. Human Ear: Acoustic Ossicle Levers & Tympanic Vibrations
        if (modelSpec.functionalType === 'human-ear' || modelSpec.id.includes('ear')) {
          const freq = parameters.frequencyHz ?? 440;
          const showVib = conditions.showVibrations !== false;
          const amp = showVib ? Math.sin(simTime * Math.min(30, freq / 15)) * 0.05 : 0;
          const tymp = meshMap.get('tympanum');
          const oss = meshMap.get('ossicles');
          if (tymp) tymp.scale.set(1.0 + amp, 1.0, 1.0 + amp);
          if (oss) oss.rotation.z = (Math.PI / 6) + amp * 1.5;
        }

        // 13. DNA Double Helix: Axial Rotation & Hydrogen Bonds
        if (modelSpec.functionalType === 'dna-helix' || modelSpec.id.includes('dna')) {
          const rotSpeed = parameters.rotationSpeed ?? 1.5;
          modelRoot.rotation.y += delta * rotSpeed * 0.5;
          const hb = meshMap.get('hydrogen-bonds');
          if (hb) hb.visible = conditions.showHydrogenBonds !== false;
        }

        // 14. Eukaryotic Cell & Nephron: Vesicle and Fluid Stream Dynamics
        if (flowPoints && flowGeo) {
          const posAttr = flowGeo.attributes.position as THREE.BufferAttribute;
          const speed = (parameters.gfr ?? parameters.metabolicRate ?? 1) > 10 ? (parameters.gfr / 125) * 0.6 : (parameters.metabolicRate ?? 1) * 0.5;

          for (let i = 0; i < numFlowParticles; i++) {
            flowT[i] = (flowT[i] + delta * speed) % 1.0;
            const t = flowT[i];
            let x = 0, y = 0, z = 0;

            if (modelSpec.functionalType === 'nephron') {
              // Path: Bowman (-2.4, 2.0) -> PCT -> Loop of Henle hairpin (0, -1.8) -> DCT -> Collecting duct (2.5, 0)
              if (t < 0.3) {
                const u = t / 0.3;
                x = -2.4 + u * 1.4;
                y = 2.0 - u * 2.2;
              } else if (t < 0.6) {
                const u = (t - 0.3) / 0.3;
                x = -1.0 + u * 1.5;
                y = -0.2 - Math.sin(u * Math.PI) * 1.6;
              } else {
                const u = (t - 0.6) / 0.4;
                x = 0.5 + u * 2.0;
                y = -0.2 - u * 2.0;
              }
            } else {
              // Intracellular vesicle flow between ER and Golgi
              const u = t * Math.PI * 2;
              x = 0.8 * Math.cos(u);
              y = 0.5 * Math.sin(u);
              z = 0.4 * Math.sin(u * 2);
            }

            posAttr.setXYZ(i, x, y, z);
          }
          posAttr.needsUpdate = true;

          // Nephron ADH hormone effect: aquaporin-2 water reabsorption concentration glow (no unphysical swelling)
          if (modelSpec.functionalType === 'nephron') {
            const adh = parameters.adhLevel ?? 5;
            const cDuct = meshMap.get('collecting-duct');
            if (cDuct && (cDuct as THREE.Mesh).material) {
              const cdMat = (cDuct as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (cdMat.emissive) {
                cdMat.emissive.setHex(0xf59e0b);
                cdMat.emissiveIntensity = 0.1 + (adh / 10) * 0.55;
              }
            }
          }
        }

        // 14. Projectile Motion Kinematics
        if (modelSpec.functionalType === 'projectile-kinematics' || modelSpec.id.includes('projectile')) {
          const v0 = parameters.velocity ?? 25;
          const angDeg = parameters.angle ?? 45;
          const g = parameters.gravity ?? 9.81;
          const theta = (angDeg * Math.PI) / 180;

          // Parabolic trajectory coordinates
          const flightTime = (2 * v0 * Math.sin(theta)) / g;
          const tCycle = (simTime * 0.85) % (flightTime + 0.6);
          const t = Math.min(flightTime, tCycle);

          const scaleDist = 0.14;
          const xPos = -3.5 + v0 * Math.cos(theta) * t * scaleDist;
          const yPos = 0.6 + (v0 * Math.sin(theta) * t - 0.5 * g * t * t) * scaleDist;

          const pSphere = meshMap.get('projectile-sphere');
          if (pSphere) {
            pSphere.position.set(xPos, Math.max(0.1, yPos), 0);
          }

          // Orient launcher cannon barrel to current launch angle
          const barrel = meshMap.get('cannon-barrel');
          if (barrel) {
            barrel.rotation.z = -theta + Math.PI / 2;
          }

          // Update theoretical peak altitude apex (H_max) and landing range (R) markers
          const rangeR = (v0 * v0 * Math.sin(2 * theta)) / g;
          const maxHeightH = Math.pow(v0 * Math.sin(theta), 2) / (2 * g);
          const apexMarker = meshMap.get('apex-marker');
          if (apexMarker) {
            apexMarker.position.set(
              -3.5 + (rangeR / 2) * scaleDist,
              0.6 + maxHeightH * scaleDist + 0.25,
              0
            );
          }
          const impactTarget = meshMap.get('impact-target');
          if (impactTarget) {
            impactTarget.position.set(-3.5 + rangeR * scaleDist, 0.6, 0);
          }
          const trajArc = meshMap.get('trajectory-arc');
          if (trajArc) {
            trajArc.visible = conditions.showTrajectory !== false;
            // Dynamically fit trajectory arc span and height to match R and H_max
            const halfSpan = Math.max(0.2, (rangeR * scaleDist) / 2);
            const arcHeight = Math.max(0.2, maxHeightH * scaleDist);
            trajArc.position.set(-3.5 + halfSpan, 0.6, 0);
            trajArc.scale.set(halfSpan / 3.2, arcHeight / 3.2, 1);
          }
        }

        // 15. Inclined Plane Dynamics: Normal force, downhill acceleration & sliding block
        if (modelSpec.functionalType === 'inclined-plane' || modelSpec.id.includes('inclined')) {
          const thetaDeg = parameters.slopeAngle ?? 30;
          const mu = parameters.frictionCoefficient ?? 0.35;
          const theta = (thetaDeg * Math.PI) / 180;

          const rampBoard = meshMap.get('ramp-board');
          const block = meshMap.get('sliding-block');
          const weightV = meshMap.get('weight-vector');
          const normalV = meshMap.get('normal-vector');
          const frictionV = meshMap.get('friction-vector');

          if (rampBoard) {
            rampBoard.rotation.z = -theta;
          }

          // Block position along ramp
          const slides = Math.tan(theta) > mu;
          const a = slides ? 9.81 * (Math.sin(theta) - mu * Math.cos(theta)) : 0;
          const slideDist = slides ? ((simTime * a * 0.3) % 3.6) : 0;

          const baseX = -1.6 + slideDist * Math.cos(theta);
          const baseY = 1.6 - slideDist * Math.sin(theta);

          if (block) {
            block.position.set(baseX, baseY, 0);
            block.rotation.z = -theta;
          }
          if (weightV) weightV.position.set(baseX, baseY - 0.6, 0);
          if (normalV) {
            normalV.position.set(baseX + 0.2 * Math.sin(theta), baseY + 0.5 * Math.cos(theta), 0);
            normalV.rotation.z = -theta + Math.PI / 2;
          }
          if (frictionV) {
            frictionV.position.set(baseX - 0.4 * Math.cos(theta), baseY + 0.4 * Math.sin(theta), 0);
            frictionV.rotation.z = -theta;
          }
        }

        // 16. Hydraulic Lift: Pascal's Principle & Piston Travel Displacements
        if (modelSpec.functionalType === 'hydraulic-lift' || modelSpec.id.includes('hydraulic')) {
          const f1 = parameters.inputForce ?? 200;
          const a1 = parameters.smallPistonArea ?? 10;
          const a2 = parameters.largePistonArea ?? 100;
          const strokeCycle = Math.sin(simTime * 1.5);

          const inputCylinder = meshMap.get('input-cylinder');
          const inputPiston = meshMap.get('input-piston');
          const outputCylinder = meshMap.get('output-cylinder');
          const outputPiston = meshMap.get('output-piston');
          const hydraulicFluid = meshMap.get('hydraulic-fluid');
          const platform = meshMap.get('lift-platform');

          // Cross-sectional area A = pi * r^2 -> radial scale proportional to sqrt(A / A_default)
          const rScale1 = Math.sqrt(a1 / 10);
          const rScale2 = Math.sqrt(a2 / 100);
          if (inputCylinder) inputCylinder.scale.set(rScale1, 1, rScale1);
          if (inputPiston) inputPiston.scale.set(rScale1, 1, rScale1);
          if (outputCylinder) outputCylinder.scale.set(rScale2, 1, rScale2);
          if (outputPiston) outputPiston.scale.set(rScale2, 1, rScale2);
          if (hydraulicFluid) hydraulicFluid.scale.set(rScale2, 1, rScale2);

          // Input stroke amplitude scales with applied effort F1; d2 = -d1 * (A1 / A2) by incompressibility
          const forceFactor = 0.5 + 0.5 * (f1 / 200);
          const d1 = strokeCycle * 0.4 * forceFactor;
          const d2 = -d1 * (a1 / a2);

          if (inputPiston) inputPiston.position.y = 0.8 + d1;
          if (outputPiston) outputPiston.position.y = 0.6 + d2;
          if (platform) platform.position.y = 1.4 + d2;
        }

        // 17. Newton's Cradle: Momentum Shockwave & Physically Consistent Elastic Collisions
        if (modelSpec.functionalType === 'newtons-cradle' || modelSpec.id.includes('cradle')) {
          const balls = [
            meshMap.get('ball-1'),
            meshMap.get('ball-2'),
            meshMap.get('ball-3'),
            meshMap.get('ball-4'),
            meshMap.get('ball-5'),
          ];

          // Extract parameters with rigorous validation
          const kDisplaced = Math.min(3, Math.max(1, Math.round(Number(parameters.ballCountDisplaced ?? 1))));
          const angleDeg = Math.min(60, Math.max(10, Number(parameters.releaseAngle ?? parameters.releaseHeight ?? 35)));
          const lengthL = Math.min(2.4, Math.max(1.0, Number(parameters.pendulumLength ?? 1.6)));
          const gravG = Math.min(25.0, Math.max(1.5, Number(parameters.gravity ?? 9.8)));
          const dampingB = Math.min(0.05, Math.max(0.0, Number(parameters.damping ?? 0.004)));
          const restE = Math.min(1.0, Math.max(0.85, Number(parameters.elasticity ?? 0.99)));
          const isIdeal = conditions.perfectElasticity === true;
          const showShock = conditions.showShockwave !== false;

          const effE = isIdeal ? 1.0 : restE;
          const effDamping = isIdeal ? 0.0 : dampingB;

          // State synchronization & parameter change detection
          const pKey = `${kDisplaced}_${angleDeg}_${lengthL}_${gravG}_${effDamping}_${effE}_${cradleRestartCounterRef.current}`;
          if (cradleSimRef.current.key !== pKey) {
            cradleSimRef.current.key = pKey;
            const theta0 = -(angleDeg * Math.PI) / 180;
            for (let i = 0; i < 5; i++) {
              cradleSimRef.current.angles[i] = i < kDisplaced ? theta0 : 0;
              cradleSimRef.current.omegas[i] = 0;
            }
            cradleSimRef.current.shockPulse = [0, 0, 0, 0];
          }

          // Sub-stepped semi-implicit Euler integration (frame-rate independent)
          const dtSim = 0.001;
          const dtFrame = Math.min(delta, 0.05);
          const steps = Math.min(Math.floor(dtFrame / dtSim), 50);

          for (let step = 0; step < steps; step++) {
            // 1. Angular acceleration: alpha = -(g/L)*sin(theta) - damping*omega
            for (let i = 0; i < 5; i++) {
              const th = cradleSimRef.current.angles[i];
              const om = cradleSimRef.current.omegas[i];
              const alpha = -(gravG / lengthL) * Math.sin(th) - effDamping * om;
              cradleSimRef.current.omegas[i] += alpha * dtSim;
              cradleSimRef.current.angles[i] += cradleSimRef.current.omegas[i] * dtSim;
            }

            // 2. Multi-pass collision resolution (transmits compressive shock wave instantly across touching balls)
            for (let pass = 0; pass < 5; pass++) {
              for (let i = 0; i < 4; i++) {
                if (cradleSimRef.current.angles[i] > cradleSimRef.current.angles[i + 1]) {
                  const vRel = cradleSimRef.current.omegas[i] - cradleSimRef.current.omegas[i + 1];
                  if (vRel > 0) {
                    const u1 = cradleSimRef.current.omegas[i];
                    const u2 = cradleSimRef.current.omegas[i + 1];
                    // Restitution momentum exchange for equal-mass spheres
                    cradleSimRef.current.omegas[i] = (u1 + u2) / 2 - (effE * (u1 - u2)) / 2;
                    cradleSimRef.current.omegas[i + 1] = (u1 + u2) / 2 + (effE * (u1 - u2)) / 2;
                    cradleSimRef.current.shockPulse[i] = 1.0;
                  }
                  // Enforce geometric non-overlap
                  const mid = (cradleSimRef.current.angles[i] + cradleSimRef.current.angles[i + 1]) / 2;
                  cradleSimRef.current.angles[i] = mid;
                  cradleSimRef.current.angles[i + 1] = mid;
                }
              }
            }

            // 3. Monotonic spatial order guard to prevent clipping or teleporting
            for (let i = 0; i < 4; i++) {
              if (cradleSimRef.current.angles[i] > cradleSimRef.current.angles[i + 1]) {
                cradleSimRef.current.angles[i] = cradleSimRef.current.angles[i + 1];
              }
            }
          }

          // 4. Update Three.js Spheres & Bifilar Suspension Strings
          const pivotY = 1.6;
          for (let i = 0; i < 5; i++) {
            const ball = balls[i];
            const theta = cradleSimRef.current.angles[i];
            const x0 = (i - 2) * 0.70;
            // Exact pendulum suspension constraint
            const ballX = x0 + lengthL * Math.sin(theta);
            const ballY = pivotY - lengthL * Math.cos(theta);

            if (ball) {
              ball.position.set(ballX, ballY, 0);
            }

            // Update String A (Front Rail +Z)
            const strA = cradleStrings[i * 2];
            if (strA) {
              const posAttrA = strA.geometry.getAttribute('position') as THREE.BufferAttribute;
              if (posAttrA) {
                posAttrA.setXYZ(0, x0, pivotY, 1.1);
                posAttrA.setXYZ(1, ballX, ballY + 0.32, 0);
                posAttrA.needsUpdate = true;
              }
            }

            // Update String B (Rear Rail -Z)
            const strB = cradleStrings[i * 2 + 1];
            if (strB) {
              const posAttrB = strB.geometry.getAttribute('position') as THREE.BufferAttribute;
              if (posAttrB) {
                posAttrB.setXYZ(0, x0, pivotY, -1.1);
                posAttrB.setXYZ(1, ballX, ballY + 0.32, 0);
                posAttrB.needsUpdate = true;
              }
            }
          }

          // 5. Update Shockwave pulse indicators
          for (let i = 0; i < 4; i++) {
            const shock = cradleShockwaves[i];
            if (shock) {
              cradleSimRef.current.shockPulse[i] = Math.max(0, cradleSimRef.current.shockPulse[i] - delta * 4);
              const op = cradleSimRef.current.shockPulse[i];
              const mat = shock.material as THREE.MeshBasicMaterial;
              if (mat) {
                mat.opacity = showShock ? op * 0.85 : 0;
              }
              const midX = (balls[i]?.position.x ?? 0) + 0.35;
              const midY = balls[i]?.position.y ?? 0;
              shock.position.set(midX, midY, 0);
            }
          }
        }

        // 18. Optics: Reflection & Refraction (Snell's Law & Total Internal Reflection)
        if (modelSpec.functionalType === 'reflection-refraction' || modelSpec.id.includes('reflection')) {
          const thetaDeg = parameters.incidentAngle ?? 45;
          const nMedium = parameters.refractiveIndex ?? 1.5;
          const isDenseToRare = Boolean(conditions.totalInternalReflection);
          const theta1 = (thetaDeg * Math.PI) / 180;

          // Air-to-Dense (n1 = 1.0, n2 = nMedium) vs Dense-to-Rare TIR mode (n1 = nMedium, n2 = 1.0)
          const n1 = isDenseToRare ? nMedium : 1.0;
          const n2 = isDenseToRare ? 1.0 : nMedium;
          const sinTheta2 = (n1 / n2) * Math.sin(theta1);
          const isTIR = sinTheta2 > 1.0;
          const theta2 = isTIR ? Math.PI / 2 : Math.asin(Math.min(0.999, sinTheta2));

          const incRay = meshMap.get('incident-ray');
          const refRay = meshMap.get('reflected-ray');
          const refrRay = meshMap.get('refracted-ray');
          const laser = meshMap.get('laser-source');

          const rayLen = 2.4;
          const zSign = isDenseToRare ? -1 : 1;
          if (incRay) {
            incRay.rotation.y = zSign * theta1;
            incRay.position.set((-rayLen / 2) * Math.sin(theta1), 0, zSign * (rayLen / 2) * Math.cos(theta1));
          }
          if (laser) {
            laser.rotation.y = zSign * theta1;
            laser.position.set(-rayLen * Math.sin(theta1), 0, zSign * rayLen * Math.cos(theta1));
          }
          if (refRay) {
            refRay.rotation.y = -zSign * theta1;
            refRay.position.set((rayLen / 2) * Math.sin(theta1), 0, zSign * (rayLen / 2) * Math.cos(theta1));
          }
          if (refrRay) {
            refrRay.visible = !isTIR;
            if (!isTIR) {
              refrRay.rotation.y = -zSign * theta2;
              refrRay.position.set((rayLen / 2) * Math.sin(theta2), 0, -zSign * (rayLen / 2) * Math.cos(theta2));
            }
          }
        }

        // 19. Optics: Prism Dispersion (Snell's Law, Normal Dispersion & ROYGBIV Spectrum)
        if (modelSpec.functionalType === 'prism-dispersion' || modelSpec.id.includes('prism')) {
          const abbeNum = parameters.dispersionStrength ?? 35;
          const apexDeg = parameters.prismApexAngle ?? 60;
          const incDeg = parameters.incidentAngle ?? 45;

          const alignRay = (mesh: THREE.Object3D | undefined, p1: THREE.Vector3, p2: THREE.Vector3, baseH = 2.4) => {
            if (!mesh) return;
            const diff = new THREE.Vector3().subVectors(p2, p1);
            const len = diff.length();
            if (len < 0.001) return;
            mesh.position.copy(p1).addScaledVector(diff, 0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.clone().normalize());
            mesh.scale.set(1, len / baseH, 1);
          };

          // Prism geometry: Apex at (0, 0.2, 1.15), Left corner at (-1.0, 0.2, -0.575), Right corner at (1.0, 0.2, -0.575)
          const prismMesh = meshMap.get('triangular-prism');
          const apexScale = apexDeg / 60;
          if (prismMesh) {
            prismMesh.scale.set(apexScale, 1, apexScale);
          }

          // Incident beam: hits entrance face center at pIn = (-0.50 * apexScale, 0.2, 0.288 * apexScale)
          const pIn = new THREE.Vector3(-0.50 * apexScale, 0.2, 0.288 * apexScale);

          // Incident angle θ₁ relative to entrance face normal (normal is ~150° in X-Z plane)
          const theta1Rad = (incDeg * Math.PI) / 180;
          const incRayAngle = (150 - incDeg) * (Math.PI / 180);
          const incDir = new THREE.Vector3(Math.cos(incRayAngle), 0, -Math.sin(incRayAngle)).normalize();

          // Light source placed along -incDir at distance 2.3
          const pSrc = pIn.clone().addScaledVector(incDir, -2.3);

          const lightSource = meshMap.get('light-source');
          const collimatorAperture = meshMap.get('collimator-aperture');
          const whiteBeam = meshMap.get('white-beam');
          const incidentArrow = meshMap.get('incident-arrow');

          if (lightSource) {
            lightSource.position.copy(pSrc);
            lightSource.rotation.y = -incRayAngle + Math.PI / 2;
          }
          if (collimatorAperture) {
            const pAperture = pSrc.clone().addScaledVector(incDir, 0.35);
            collimatorAperture.position.copy(pAperture);
            collimatorAperture.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), incDir);
          }
          if (incidentArrow) {
            const pArrow = pSrc.clone().addScaledVector(incDir, 1.25);
            incidentArrow.position.copy(pArrow);
            incidentArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), incDir);
          }
          alignRay(whiteBeam, pSrc, pIn, 2.4);

          // Dispersion factor: inversely proportional to Abbe number (standard optics)
          const dispMult = 35 / Math.max(15, abbeNum);

          // Spectral channels: Wavelengths from Red (700nm) down to Violet (400nm)
          const spectrumConfigs = [
            { id: 'red-ray', intId: 'internal-red-ray', baseN: 1.514, dN: -0.016 * dispMult },
            { id: 'orange-ray', intId: 'internal-orange-ray', baseN: 1.517, dN: -0.008 * dispMult },
            { id: 'yellow-ray', intId: 'internal-yellow-ray', baseN: 1.520, dN: 0.000 },
            { id: 'green-ray', intId: 'internal-green-ray', baseN: 1.523, dN: +0.009 * dispMult },
            { id: 'blue-ray', intId: 'internal-blue-ray', baseN: 1.527, dN: +0.019 * dispMult },
            { id: 'violet-ray', intId: 'internal-violet-ray', baseN: 1.532, dN: +0.032 * dispMult },
          ];

          const screenX = 2.45;
          const screenArrivalZ: number[] = [];

          spectrumConfigs.forEach((spec) => {
            const nGlass = spec.baseN + spec.dN;

            // Snell's Law at Face 1: 1.0 * sin(theta1) = nGlass * sin(theta2)
            const sinTheta2 = Math.sin(theta1Rad) / nGlass;
            const theta2Rad = Math.asin(Math.min(0.999, sinTheta2));

            // Refracted internal direction inside glass (bends toward normal)
            const normal1Angle = 150 * (Math.PI / 180);
            const internalAngle = normal1Angle - Math.PI + theta2Rad;
            const glassDir = new THREE.Vector3(Math.cos(internalAngle), 0, -Math.sin(internalAngle)).normalize();

            // Intersect with Face 2 line: 1.725 * x + z - (1.15 * apexScale) = 0
            const denom = 1.725 * glassDir.x + glassDir.z;
            let tExit = 0.95;
            if (Math.abs(denom) > 0.0001) {
              tExit = (1.15 * apexScale - 1.725 * pIn.x - pIn.z) / denom;
            }
            const pExit = pIn.clone().addScaledVector(glassDir, Math.max(0.2, tExit));

            // Internal ray cylinder
            const intRay = meshMap.get(spec.intId);
            alignRay(intRay, pIn, pExit, 1.0);

            // Refraction at Face 2 (Glass -> Air, bends away from normal):
            const apexRad = (apexDeg * Math.PI) / 180;
            const theta3Rad = Math.max(0.05, Math.min(0.72, apexRad - theta2Rad));
            const sinTheta4 = Math.min(0.99, nGlass * Math.sin(theta3Rad));
            const theta4Rad = Math.asin(sinTheta4);

            const outRayAngle = -30 * (Math.PI / 180) - theta4Rad;
            const outDir = new THREE.Vector3(Math.cos(outRayAngle), 0, Math.sin(outRayAngle)).normalize();

            // Trace to projection screen at x = screenX
            const tScreen = Math.max(0.5, (screenX - pExit.x) / (outDir.x || 0.001));
            const pScreen = pExit.clone().addScaledVector(outDir, tScreen);
            screenArrivalZ.push(pScreen.z);

            // Emerging spectral ray
            const extRay = meshMap.get(spec.id);
            alignRay(extRay, pExit, pScreen, 2.5);
          });

          // Update spectrum patch on observation screen
          const spectrumPatch = meshMap.get('spectrum-patch');
          if (spectrumPatch && screenArrivalZ.length > 0) {
            const minZ = Math.min(...screenArrivalZ);
            const maxZ = Math.max(...screenArrivalZ);
            const centerZ = (minZ + maxZ) / 2;
            const spanZ = Math.max(0.4, Math.abs(maxZ - minZ) + 0.15);
            spectrumPatch.position.set(screenX - 0.02, 0.2, centerZ);
            spectrumPatch.scale.set(1, 1, spanZ / 1.2);
          }
        }

        // 20. Electric Circuit: Ohm's Law, Switch Lever Blade & Joule Heating Filament Glow
        if (modelSpec.functionalType === 'electric-circuit' || modelSpec.id.includes('circuit')) {
          const isClosed = conditions.switchClosed !== false;
          const v = parameters.voltage ?? 12;
          const r = parameters.resistance ?? 6;
          const current = isClosed ? v / r : 0;
          const power = current * v; // P = V^2 / R

          const switchBlade = meshMap.get('switch-lever');
          const bulbGlass = meshMap.get('bulb-glass');

          if (switchBlade) {
            // Closed: 0 rad (touching contact); Open: tilted up at ~0.65 rad
            const targetRot = isClosed ? 0 : 0.65;
            switchBlade.rotation.x += (targetRot - switchBlade.rotation.x) * delta * 8;
          }

          if (bulbGlass && bulbGlass instanceof THREE.Mesh) {
            const mat = bulbGlass.material as THREE.MeshStandardMaterial;
            if (mat && 'emissiveIntensity' in mat) {
              const normP = Math.min(2.0, Math.max(0, (power / 30) * 1.1));
              mat.emissiveIntensity = isClosed ? normP : 0.05;
              mat.opacity = isClosed ? 0.95 : 0.45;
            }
          }
        }

        // 21. Model 11: Friction Explorer
        if (modelSpec.functionalType === 'friction-explorer') {
          const m = parameters.mass ?? 4;
          const g = 9.81;
          const F_N = m * g;
          const W = F_N;
          const mu_s = parameters.muStatic ?? 0.4;
          const mu_k = parameters.muKinetic ?? 0.3;
          const F_app = parameters.appliedForce ?? 15;
          const f_s_max = mu_s * F_N;
          const f_k = mu_k * F_N;

          const isMoving = F_app > f_s_max;
          const frictionForce = isMoving ? f_k : F_app;
          const a = isMoving ? (F_app - f_k) / m : 0;

          // Block translation
          const slideSpeed = Math.max(0.6, a * 0.35);
          const blockX = isMoving ? -3.2 + ((simTime * slideSpeed) % 6.4) : 0;

          const blockMesh = meshMap.get('block');
          const contactMesh = meshMap.get('contact-interface');
          const arrowApp = meshMap.get('arrow-applied');
          const arrowFric = meshMap.get('arrow-friction');
          const arrowNorm = meshMap.get('arrow-normal');
          const arrowWeight = meshMap.get('arrow-weight');

          if (blockMesh) blockMesh.position.set(blockX, 0.7, 0);
          if (contactMesh) contactMesh.position.set(blockX, 0.02, 0);

          if (arrowApp) {
            arrowApp.position.set(blockX + 1.2 + Math.min(1.5, F_app / 35), 0.7, 0);
            arrowApp.scale.set(1, Math.min(2.5, Math.max(0.4, F_app / 20)), 1);
          }
          if (arrowFric) {
            arrowFric.position.set(blockX - 1.2 - Math.min(1.5, frictionForce / 35), 0.7, 0);
            arrowFric.scale.set(1, Math.min(2.2, Math.max(0.3, frictionForce / 20)), 1);
          }
          if (arrowNorm) {
            arrowNorm.position.set(blockX, 1.4 + Math.min(1.2, F_N / 45), 0);
            arrowNorm.scale.set(1, Math.min(2.2, Math.max(0.4, F_N / 40)), 1);
          }
          if (arrowWeight) {
            arrowWeight.position.set(blockX, -0.6 - Math.min(1.2, W / 45), 0);
            arrowWeight.scale.set(1, Math.min(2.2, Math.max(0.4, W / 40)), 1);
          }

          if (asperitiesMesh) {
            const isMicro = conditions.inspectionView === 'microscopic_asperities';
            frictionAuxGroup.visible = isMicro;
            frictionAuxGroup.position.x = blockX;
          }
        }

        // 22. Model 12: Wave Motion Explorer
        if (modelSpec.functionalType === 'wave-motion') {
          const amp = (parameters.amplitude ?? 0.8) * 0.9;
          const lambda = parameters.wavelength ?? 3.0;
          const freq = parameters.frequency ?? 1.5;
          const k = (2 * Math.PI) / lambda;
          const omega = 2 * Math.PI * freq;
          const isStanding = conditions.inspectionView === 'standing_waves' || conditions.inspectionView === 'standing-vs-traveling';

          if (waveLine && waveGeo) {
            const posAttr = waveGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < numWavePts; i++) {
              const x = -5.0 + (i / (numWavePts - 1)) * 10.0;
              const y = isStanding
                ? 2 * amp * Math.sin(k * x) * Math.cos(omega * simTime)
                : amp * Math.sin(k * x - omega * simTime);
              posAttr.setY(i, y);
            }
            posAttr.needsUpdate = true;
          }

          const driver = meshMap.get('wave-generator');
          if (driver) {
            driver.position.y = amp * Math.sin(-5.0 * k - omega * simTime);
          }

          const tracker = meshMap.get('tracker-particle');
          const velArrow = meshMap.get('velocity-vector');
          const yTrack = isStanding
            ? 2 * amp * Math.sin(k * 0.75) * Math.cos(omega * simTime)
            : amp * Math.sin(-omega * simTime);
          const vyTrack = isStanding
            ? -2 * omega * amp * Math.sin(k * 0.75) * Math.sin(omega * simTime)
            : -omega * amp * Math.cos(-omega * simTime);

          if (tracker) {
            tracker.position.set(isStanding ? 0.75 : 0, yTrack, 0);
          }
          if (velArrow) {
            velArrow.position.set(isStanding ? 0.75 : 0, yTrack + (vyTrack >= 0 ? 0.6 : -0.6), 0);
            velArrow.rotation.z = vyTrack >= 0 ? 0 : Math.PI;
            const maxVy = (isStanding ? 2 * Math.abs(Math.sin(k * 0.75)) : 1) * omega * amp || 1;
            velArrow.scale.set(1, Math.min(2.0, Math.max(0.15, Math.abs(vyTrack) / maxVy)), 1);
          }

          const waveProp = meshMap.get('wave-prop-arrow');
          if (waveProp) {
            waveProp.visible = !isStanding;
          }

          const waveBracket = meshMap.get('wavelength-bracket');
          if (waveBracket) {
            waveBracket.scale.set(lambda / 3.0, 1, 1);
          }
        }

        // 23. Model 13: Sound Wave Explorer
        if (modelSpec.functionalType === 'sound-wave') {
          const amp = parameters.amplitude ?? 0.8;
          const freqHz = parameters.frequency ?? 440;
          const speedParam = parameters.waveSpeed ?? 343;
          const medium = conditions.medium ?? 'air';
          const isVacuum = medium === 'vacuum';
          const effectiveAmp = isVacuum ? 0 : amp;

          // Medium acoustic wave speed scaling (Air 343 m/s, Water 1480 m/s, Steel 5960 m/s)
          const mediumSpeedFactor =
            medium === 'steel' ? 2.4 : medium === 'water' ? 1.65 : (speedParam / 343);
          const omegaSound = 4.5 * (freqHz / 440);
          const kSound = Math.max(0.8, Math.min(4.5, (2.2 * (freqHz / 440)) / Math.max(0.4, mediumSpeedFactor)));

          const speaker = meshMap.get('speaker-cone');
          if (speaker) {
            speaker.position.x = -4.6 + (effectiveAmp * 0.25) * Math.sin(omegaSound * simTime);
          }

          const mic = meshMap.get('receiver-microphone');
          if (mic) {
            mic.position.x = 4.6 + (effectiveAmp * 0.1) * Math.sin(omegaSound * simTime - kSound * 8.0);
          }

          if (soundParticlesObj && soundParticlesGeo) {
            const posAttr = soundParticlesGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < numSoundParticles; i++) {
              const eqX = soundEquilibriumX[i];
              const disp = (effectiveAmp * 0.35) * Math.cos(kSound * eqX - omegaSound * simTime);
              posAttr.setX(i, eqX + disp);
            }
            posAttr.needsUpdate = true;
          }

          if (pressureSineLine && pressureSineGeo) {
            // Gauge acoustic pressure delta_P = -B * ds/dx = +B * k * s0 * sin(k*x - omega*t)
            const pAttr = pressureSineGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < numPressurePts; i++) {
              const x = -3.8 + (i / (numPressurePts - 1)) * 7.6;
              const pVal = isVacuum ? 0 : (effectiveAmp * 0.6) * Math.sin(kSound * x - omegaSound * simTime);
              pAttr.setY(i, 2.2 + pVal);
            }
            pAttr.needsUpdate = true;
          }
        }

        // 24. Model 14: Magnetic Field Explorer
        if (modelSpec.functionalType === 'magnetic-field-explorer') {
          const demoType = conditions.demonstrationType ?? 'bar-magnet';
          const isWire = demoType === 'straight-wire-oersted' || demoType === 'combined-superposition';
          const isMagnet = demoType === 'bar-magnet' || demoType === 'combined-superposition';
          const isUpwards = conditions.currentDirection !== 'downwards';
          const wireDir = isUpwards ? 1 : -1;
          const fieldStr = parameters.fieldStrength ?? 2.0;

          wireFieldGroup.visible = isWire;

          if (wireFluxPoints && wireFluxGeo) {
            const posAttr = wireFluxGeo.attributes.position as THREE.BufferAttribute;
            const rWire = 2.0;
            // Right-Hand Grip Rule: thumb along +Y -> fingers curl from +Z toward +X (decreasing polar angle in X-Z plane)
            for (let i = 0; i < numWireFlux; i++) {
              wireFluxAngles[i] -= delta * 1.25 * fieldStr * wireDir;
              const a = wireFluxAngles[i];
              posAttr.setXYZ(i, rWire * Math.cos(a), 0, rWire * Math.sin(a));
            }
            posAttr.needsUpdate = true;
          }

          const needleN = meshMap.get('compass-needle-n');
          const needleS = meshMap.get('compass-needle-s');
          const probeR = parameters.probeRadius ?? 2.0;
          const probeAngle = simTime * 0.35;
          const px = probeR * Math.cos(probeAngle);
          const pz = probeR * Math.sin(probeAngle);

          let bx = 0;
          let bz = 0;
          if (isWire) {
            // B_wire = (mu_0 I / 2pi r) (y_hat x r_hat) = wireDir * (sin(theta), 0, -cos(theta))
            bx += Math.sin(probeAngle) * wireDir * (fieldStr / 2.0);
            bz += -Math.cos(probeAngle) * wireDir * (fieldStr / 2.0);
          }
          if (isMagnet) {
            // Bar magnet has North pole at x = -1.1 and South pole at x = +1.1 -> magnetic moment m along -X
            const rMag = Math.max(0.5, Math.hypot(px, pz));
            const rx = px / rMag;
            const rz = pz / rMag;
            // B_dipole proportional to 3(m . r_hat)r_hat - m with m = (-1, 0, 0)
            const mDotR = -rx;
            bx += (3 * mDotR * rx - (-1)) * (fieldStr / 2.0);
            bz += (3 * mDotR * rz) * (fieldStr / 2.0);
          }

          const bAngle = Math.atan2(bz, bx);
          if (needleN) {
            needleN.position.set(px, 0.4, pz);
            needleN.rotation.y = -bAngle;
          }
          if (needleS) {
            needleS.position.set(px, 0.4, pz);
            needleS.rotation.y = -bAngle + Math.PI;
          }
        }

        // 25. Model 16: Interactive Atom Explorer
        if (modelSpec.functionalType === 'interactive-atom') {
          const el = conditions.element ?? 'carbon';
          const speed = (parameters.orbitSpeed ?? 1.5) * 1.8;
          let z = 6;
          if (el === 'hydrogen') z = 1;
          else if (el === 'carbon') z = 6;
          else if (el === 'oxygen') z = 8;
          else if (el === 'sodium') z = 11;

          const kCount = Math.min(2, z);
          const lCount = Math.min(8, Math.max(0, z - 2));
          const mCount = Math.min(8, Math.max(0, z - 10));

          electronMeshes.forEach((mesh, idx) => {
            if (idx < z) {
              mesh.visible = true;
              let r = 1.82;
              let shellIdx = idx;
              let shellTotal = kCount;
              let shellSpeed = speed * 1.4;

              if (idx >= 2 && idx < 10) {
                r = 3.22;
                shellIdx = idx - 2;
                shellTotal = lCount;
                shellSpeed = speed * 0.9;
              } else if (idx >= 10) {
                r = 4.62;
                shellIdx = idx - 10;
                shellTotal = mCount;
                shellSpeed = speed * 0.6;
              }

              const angle = simTime * shellSpeed + (shellIdx / shellTotal) * Math.PI * 2;
              mesh.position.set(r * Math.cos(angle), 0, r * Math.sin(angle));
            } else {
              mesh.visible = false;
            }
          });

          if (orbitalCloudPoints) {
            const isCloud = conditions.inspectionView === 'electron-cloud-orbitals' || conditions.inspectionView === 'orbitals';
            orbitalCloudPoints.visible = isCloud;
            orbitalCloudPoints.rotation.y += delta * 0.5;
          }
        }

        // 26. Model 17: Ionic & Covalent Bonding Explorer (Scientific Simulation Engine)
        if (modelSpec.functionalType === 'bonding-explorer') {
          const ex = conditions.example ?? 'sodium_chloride';
          const isLattice = conditions.latticeVsPair === 'repeating_lattice';
          const showShells = conditions.showBohrShells !== false;
          const prog = Math.min(100, Math.max(0, Number(parameters.reactionProgress ?? 100))) / 100;
          const sepParam = Math.min(4.0, Math.max(1.4, Number(parameters.atomSeparation ?? 2.8)));

          // Core meshes from model spec
          const naIon = meshMap.get('sodium-ion');
          const clIon = meshMap.get('chloride-ion');
          const bondRod = meshMap.get('ionic-bond-rod');
          const transferArrow = meshMap.get('electron-transfer-arrow');
          const sharedPair = meshMap.get('covalent-shared-pair');
          const cornerNa = meshMap.get('lattice-corner-na1');
          const cornerCl = meshMap.get('lattice-corner-cl1');

          // Determine bonding category
          const isIonic = ex === 'sodium_chloride' || ex === 'lithium_fluoride';
          const isWater = ex === 'water';
          const isMethane = ex === 'methane';
          const isHydrogen = ex === 'hydrogen_gas';

          // Lattice group visibility
          bondingLatticeGroup.visible = isIonic && isLattice;
          if (cornerNa) cornerNa.visible = isIonic && isLattice;
          if (cornerCl) cornerCl.visible = isIonic && isLattice;

          // Hide/show auxiliary peripheral atoms & covalent bond meshes
          bondingPeripheralAtomMeshes.forEach((m) => { m.visible = false; });
          bondingCovalentBondMeshes.forEach((m) => { m.visible = false; });
          bondingBohrRingLines.forEach((m) => { m.visible = false; });
          bondingElectronMeshes.forEach((m) => { m.visible = false; });

          // Effective inter-nuclear distance (contracts as bond forms)
          const effectiveSep = sepParam * (1 - 0.25 * prog);

          if (isIonic) {
            // ==========================================
            // IONIC BONDING: Electron Transfer & Electrostatic Lattice/Pair
            // ==========================================
            const isNaCl = ex === 'sodium_chloride';
            // Metal atom (Left) and Halogen atom (Right)
            const leftX = -effectiveSep / 2;
            const rightX = effectiveSep / 2;

            if (naIon) {
              naIon.visible = true;
              naIon.position.set(leftX, 0, 0);
              // As electron transfers, cation loses outer shell and contracts
              const scaleCat = 1.0 - 0.22 * prog;
              naIon.scale.set(scaleCat, scaleCat, scaleCat);
              const mat = (naIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) {
                mat.color.set(isNaCl ? (prog > 0.6 ? '#A78BFA' : '#8B5CF6') : (prog > 0.6 ? '#F43F5E' : '#E11D48'));
              }
            }

            if (clIon) {
              clIon.visible = true;
              clIon.position.set(rightX, 0, 0);
              // As halogen receives electron, anion outer shell expands slightly
              const scaleAn = 1.0 + 0.18 * prog;
              clIon.scale.set(scaleAn, scaleAn, scaleAn);
              const mat = (clIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) {
                mat.color.set(isNaCl ? (prog > 0.6 ? '#059669' : '#10B981') : (prog > 0.6 ? '#0284C7' : '#0EA5E9'));
              }
            }

            // Electrostatic attraction line (Coulomb force)
            if (bondRod) {
              bondRod.visible = prog > 0.35 && !isLattice;
              bondRod.position.set(0, 0, 0);
              const rodLen = effectiveSep * 0.75;
              bondRod.scale.set(1, rodLen / 2.2, 1);
              const pulse = 0.5 + Math.sin(simTime * 5) * 0.2;
              const rodMat = (bondRod as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (rodMat && 'opacity' in rodMat) {
                rodMat.opacity = Math.min(0.9, prog * pulse);
              }
            }

            // Transfer vector arrow
            if (transferArrow) {
              transferArrow.visible = prog > 0.15 && prog < 0.85 && !isLattice;
              const arrowX = leftX + (rightX - leftX) * (0.3 + 0.4 * Math.sin(simTime * 3));
              transferArrow.position.set(arrowX, 0.7, 0);
            }

            if (sharedPair) sharedPair.visible = false;

            // Concentric Bohr Valence Shells (Rings)
            if (showShells && !isLattice) {
              // Left metal rings (Inner K-shell at 0.7, L-shell at 1.15, Valence M/L at 1.55)
              const shellRadiiLeft = isNaCl ? [0.65, 1.05, 1.5] : [0.65, 1.1];
              shellRadiiLeft.forEach((r, idx) => {
                const ring = bondingBohrRingLines[idx];
                if (ring) {
                  ring.visible = true;
                  ring.position.set(leftX, 0, 0);
                  ring.scale.set(r / 1.25, r / 1.25, 1);
                  // Outer shell depopulates when electron is lost
                  const rMat = ring.material as THREE.LineBasicMaterial;
                  if (rMat) {
                    rMat.opacity = (idx === shellRadiiLeft.length - 1 && prog > 0.8) ? Math.max(0.1, 1 - prog) : 0.45;
                  }
                }
              });

              // Right halogen rings
              const shellRadiiRight = isNaCl ? [0.65, 1.05, 1.5] : [0.65, 1.15];
              shellRadiiRight.forEach((r, idx) => {
                const ring = bondingBohrRingLines[3 + idx];
                if (ring) {
                  ring.visible = true;
                  ring.position.set(rightX, 0, 0);
                  ring.scale.set(r / 1.25, r / 1.25, 1);
                  const rMat = ring.material as THREE.LineBasicMaterial;
                  if (rMat) rMat.opacity = 0.45;
                }
              });
            }

            // Valence Electrons Accounting (STRICT CONSERVATION: Exactly 8 electrons total, 0 duplicated)
            if (!isLattice) {
              const valRadiusLeft = isNaCl ? 1.5 : 1.1;
              const valRadiusRight = isNaCl ? 1.5 : 1.15;

              // Electron 0: The Transferred Electron (travels across from Left to Right)
              const eTrans = bondingElectronMeshes[0];
              if (eTrans) {
                eTrans.visible = true;
                if (prog < 0.25) {
                  // Orbiting on metal valence shell
                  const ang = simTime * 3;
                  eTrans.position.set(leftX + valRadiusLeft * Math.cos(ang), valRadiusLeft * Math.sin(ang), 0);
                } else if (prog < 0.8) {
                  // In transit across inter-atomic space along smooth path
                  const t = (prog - 0.25) / 0.55;
                  const curX = leftX + (rightX - leftX) * t;
                  const curY = Math.sin(t * Math.PI) * 0.75;
                  eTrans.position.set(curX, curY, 0);
                } else {
                  // Integrated into halogen octet
                  const ang = simTime * 2 + (7 / 8) * Math.PI * 2;
                  eTrans.position.set(rightX + valRadiusRight * Math.cos(ang), valRadiusRight * Math.sin(ang), 0);
                }
              }

              // Electrons 1 through 7: Halogen native valence electrons (arranged in pairs)
              for (let i = 1; i <= 7; i++) {
                const eMesh = bondingElectronMeshes[i];
                if (eMesh) {
                  eMesh.visible = true;
                  const ang = simTime * 2 + ((i - 1) / 8) * Math.PI * 2;
                  eMesh.position.set(rightX + valRadiusRight * Math.cos(ang), valRadiusRight * Math.sin(ang), 0);
                }
              }
            }
          } else if (isWater) {
            // ==========================================
            // COVALENT BONDING: Water (H2O - Bent 104.5°)
            // ==========================================
            const bentAngle = (104.5 * Math.PI) / 180;
            const bondLen = 1.6 * (1 - 0.2 * prog);

            // Oxygen at center
            if (naIon) {
              naIon.visible = true;
              naIon.position.set(0, 0.2, 0);
              naIon.scale.set(1.05, 1.05, 1.05);
              const mat = (naIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#EF4444');
            }

            // Hydrogen 1 (Left leg)
            const h1x = -bondLen * Math.sin(bentAngle / 2);
            const h1y = 0.2 - bondLen * Math.cos(bentAngle / 2);
            if (clIon) {
              clIon.visible = true;
              clIon.position.set(h1x, h1y, 0);
              clIon.scale.set(0.65, 0.65, 0.65);
              const mat = (clIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#F8FAFC');
            }

            // Hydrogen 2 (Right leg)
            const h2x = bondLen * Math.sin(bentAngle / 2);
            const h2y = 0.2 - bondLen * Math.cos(bentAngle / 2);
            const h2Mesh = bondingPeripheralAtomMeshes[0];
            if (h2Mesh) {
              h2Mesh.visible = true;
              h2Mesh.position.set(h2x, h2y, 0);
            }

            if (bondRod) bondRod.visible = false;
            if (transferArrow) transferArrow.visible = false;

            // Covalent Bond cylinders (2 single sigma bonds)
            const b1 = bondingCovalentBondMeshes[0];
            if (b1) {
              b1.visible = prog > 0.25;
              b1.position.set(h1x / 2, (0.2 + h1y) / 2, 0);
              b1.rotation.z = -bentAngle / 2;
              b1.scale.set(1, (bondLen / 1.4) * prog, 1);
            }
            const b2 = bondingCovalentBondMeshes[1];
            if (b2) {
              b2.visible = prog > 0.25;
              b2.position.set(h2x / 2, (0.2 + h2y) / 2, 0);
              b2.rotation.z = bentAngle / 2;
              b2.scale.set(1, (bondLen / 1.4) * prog, 1);
            }

            // Shared pair cloud pulse
            if (sharedPair) {
              sharedPair.visible = prog > 0.4;
              sharedPair.position.set(0, -0.4, 0);
              sharedPair.scale.set(1.1, 0.4, 1.1);
            }

            // Concentric Bohr shell around Oxygen
            if (showShells) {
              const rO = bondingBohrRingLines[0];
              if (rO) {
                rO.visible = true;
                rO.position.set(0, 0.2, 0);
                rO.scale.set(1.1, 1.1, 1);
              }
            }

            // Strict Electron Conservation for H2O: Exactly 8 valence electrons
            // Pair 1: Shared bonding pair along O-H1 axis
            for (let i = 0; i < 2; i++) {
              const e = bondingElectronMeshes[i];
              if (e) {
                e.visible = true;
                const offset = (i === 0 ? -0.08 : 0.08);
                const t = 0.5 + offset * Math.sin(simTime * 4);
                e.position.set(h1x * t, 0.2 + (h1y - 0.2) * t + (i === 0 ? 0.08 : -0.08), 0);
              }
            }

            // Pair 2: Shared bonding pair along O-H2 axis
            for (let i = 2; i < 4; i++) {
              const e = bondingElectronMeshes[i];
              if (e) {
                e.visible = true;
                const offset = (i === 2 ? -0.08 : 0.08);
                const t = 0.5 + offset * Math.sin(simTime * 4);
                e.position.set(h2x * t, 0.2 + (h2y - 0.2) * t + (i === 2 ? 0.08 : -0.08), 0);
              }
            }

            // Pair 3: Oxygen Non-Bonding Lone Pair 1 (sp3 lobe pointing upper-left-back)
            const lp1Mesh1 = bondingElectronMeshes[4];
            const lp1Mesh2 = bondingElectronMeshes[5];
            if (lp1Mesh1 && lp1Mesh2) {
              lp1Mesh1.visible = true;
              lp1Mesh2.visible = true;
              lp1Mesh1.position.set(-0.7, 1.1, -0.35 + Math.sin(simTime * 2) * 0.05);
              lp1Mesh2.position.set(-0.85, 0.95, -0.35 - Math.sin(simTime * 2) * 0.05);
            }

            // Pair 4: Oxygen Non-Bonding Lone Pair 2 (sp3 lobe pointing upper-right-front)
            const lp2Mesh1 = bondingElectronMeshes[6];
            const lp2Mesh2 = bondingElectronMeshes[7];
            if (lp2Mesh1 && lp2Mesh2) {
              lp2Mesh1.visible = true;
              lp2Mesh2.visible = true;
              lp2Mesh1.position.set(0.7, 1.1, 0.35 + Math.cos(simTime * 2) * 0.05);
              lp2Mesh2.position.set(0.85, 0.95, 0.35 - Math.cos(simTime * 2) * 0.05);
            }
          } else if (isMethane) {
            // ==========================================
            // COVALENT BONDING: Methane (CH4 - Tetrahedral 109.5°)
            // ==========================================
            const tetR = 1.7 * (1 - 0.2 * prog);
            const c0 = tetR / Math.sqrt(3);
            const tetVerts = [
              new THREE.Vector3(c0, c0, c0),
              new THREE.Vector3(-c0, -c0, c0),
              new THREE.Vector3(-c0, c0, -c0),
              new THREE.Vector3(c0, -c0, -c0),
            ];

            // Central Carbon atom
            if (naIon) {
              naIon.visible = true;
              naIon.position.set(0, 0, 0);
              naIon.scale.set(0.95, 0.95, 0.95);
              const mat = (naIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#64748B');
            }

            // Hydrogen 1 using clIon
            if (clIon) {
              clIon.visible = true;
              clIon.position.copy(tetVerts[0]);
              clIon.scale.set(0.65, 0.65, 0.65);
              const mat = (clIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#F8FAFC');
            }

            // Hydrogens 2, 3, 4 using peripheral meshes
            for (let k = 0; k < 3; k++) {
              const hMesh = bondingPeripheralAtomMeshes[k];
              if (hMesh) {
                hMesh.visible = true;
                hMesh.position.copy(tetVerts[k + 1]);
              }
            }

            if (bondRod) bondRod.visible = false;
            if (transferArrow) transferArrow.visible = false;
            if (sharedPair) sharedPair.visible = false;

            // 4 Covalent Bond Tubes
            for (let k = 0; k < 4; k++) {
              const b = bondingCovalentBondMeshes[k];
              if (b) {
                b.visible = prog > 0.25;
                const mid = tetVerts[k].clone().multiplyScalar(0.5);
                b.position.copy(mid);
                b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tetVerts[k].clone().normalize());
                b.scale.set(0.8, (tetR / 1.4) * prog, 0.8);
              }
            }

            // 4 Shared Electron Pairs = 8 Shared Valence Electrons (0 Lone Pairs)
            for (let k = 0; k < 4; k++) {
              const v = tetVerts[k];
              const e1 = bondingElectronMeshes[k * 2];
              const e2 = bondingElectronMeshes[k * 2 + 1];
              if (e1 && e2) {
                e1.visible = true;
                e2.visible = true;
                const t = 0.5;
                const mid = v.clone().multiplyScalar(t);
                e1.position.set(mid.x + 0.08, mid.y + 0.08, mid.z);
                e2.position.set(mid.x - 0.08, mid.y - 0.08, mid.z);
              }
            }
          } else if (isHydrogen) {
            // ==========================================
            // COVALENT BONDING: Hydrogen Molecule (H2 - Single Bond)
            // ==========================================
            const hDist = 1.1 * (1 - 0.3 * prog);
            if (naIon) {
              naIon.visible = true;
              naIon.position.set(-hDist, 0, 0);
              naIon.scale.set(0.65, 0.65, 0.65);
              const mat = (naIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#F8FAFC');
            }
            if (clIon) {
              clIon.visible = true;
              clIon.position.set(hDist, 0, 0);
              clIon.scale.set(0.65, 0.65, 0.65);
              const mat = (clIon as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) mat.color.set('#F8FAFC');
            }

            if (bondRod) bondRod.visible = false;
            if (transferArrow) transferArrow.visible = false;

            const b1 = bondingCovalentBondMeshes[0];
            if (b1) {
              b1.visible = prog > 0.25;
              b1.position.set(0, 0, 0);
              b1.rotation.z = Math.PI / 2;
              b1.scale.set(0.7, (hDist * 2) / 1.4, 0.7);
            }

            // Exactly 2 electrons in the shared covalent bond
            const e1 = bondingElectronMeshes[0];
            const e2 = bondingElectronMeshes[1];
            if (e1 && e2) {
              e1.visible = true;
              e2.visible = true;
              const ang = simTime * 4;
              e1.position.set(0, 0.25 * Math.sin(ang), 0.25 * Math.cos(ang));
              e2.position.set(0, -0.25 * Math.sin(ang), -0.25 * Math.cos(ang));
            }
          }
        }

        // 27. Model 18: Water Molecule Explorer
        if (modelSpec.functionalType === 'water-molecule-detailed') {
          const angleDeg = parameters.bondAngle ?? 104.5;
          const theta = (angleDeg * Math.PI) / 180;
          const rBond = 1.6;

          const h1 = meshMap.get('hydrogen-1');
          const h2 = meshMap.get('hydrogen-2');
          const b1 = meshMap.get('bond-1');
          const b2 = meshMap.get('bond-2');
          const lp1 = meshMap.get('lone-pair-1');
          const lp2 = meshMap.get('lone-pair-2');
          const dip = meshMap.get('dipole-vector');

          const h1x = -rBond * Math.sin(theta / 2);
          const h1y = 0.3 - rBond * Math.cos(theta / 2);
          const h2x = rBond * Math.sin(theta / 2);
          const h2y = 0.3 - rBond * Math.cos(theta / 2);

          if (h1) h1.position.set(h1x, h1y, 0);
          if (h2) h2.position.set(h2x, h2y, 0);

          if (b1) {
            b1.position.set(h1x / 2, (0.3 + h1y) / 2, 0);
            b1.rotation.z = -theta / 2;
          }
          if (b2) {
            b2.position.set(h2x / 2, (0.3 + h2y) / 2, 0);
            b2.rotation.z = theta / 2;
          }

          const vMode = conditions.viewMode ?? 'single_molecule';
          const showLP = conditions.showLonePairs !== false && vMode !== 'hydrogen_bonding_collection';
          if (lp1) lp1.visible = showLP;
          if (lp2) lp2.visible = showLP;
          if (dip) dip.visible = conditions.showPolarVectors !== false;

          const showCluster =
            vMode === 'hydrogen_bonding_collection' ||
            vMode === 'hydrogen-bonding-cluster' ||
            vMode === 'hydrogen_bonding' ||
            vMode === 'cluster';
          waterClusterGroup.visible = Boolean(showCluster);
        }

        // 28. Model 19: Carbon Dioxide Molecule Explorer
        if (modelSpec.functionalType === 'carbon-dioxide-explorer') {
          const viewMode = conditions.viewMode ?? 'single_molecule_inspection';
          const isGas =
            viewMode === 'gas_particles_collection' ||
            viewMode === 'molecular-gas-collection' ||
            viewMode === 'gas_collection' ||
            viewMode === 'gas';
          const isVibrational = viewMode === 'vibrational-modes';

          co2GasGroup.visible = isGas;

          const cAtom = meshMap.get('carbon-atom');
          const oxL = meshMap.get('oxygen-left');
          const oxR = meshMap.get('oxygen-right');
          const dbL1 = meshMap.get('double-bond-left-1');
          const dbL2 = meshMap.get('double-bond-left-2');
          const dbR1 = meshMap.get('double-bond-right-1');
          const dbR2 = meshMap.get('double-bond-right-2');
          const dipL = meshMap.get('dipole-left');
          const dipR = meshMap.get('dipole-right');

          const showDip = conditions.showDipoles !== false && !isGas;
          if (dipL) dipL.visible = showDip;
          if (dipR) dipR.visible = showDip;

          if (isVibrational) {
            const vib = Math.sin(simTime * 6) * 0.25;
            if (cAtom) cAtom.position.x = -vib * 0.8;
            if (oxL) oxL.position.x = -2.2 + vib;
            if (oxR) oxR.position.x = 2.2 + vib;
            if (dbL1) dbL1.position.x = -1.1 + vib * 0.5;
            if (dbL2) dbL2.position.x = -1.1 + vib * 0.5;
            if (dbR1) dbR1.position.x = 1.1 + vib * 0.5;
            if (dbR2) dbR2.position.x = 1.1 + vib * 0.5;
          } else {
            if (cAtom) cAtom.position.set(0, 0, 0);
            if (oxL) oxL.position.set(-2.2, 0, 0);
            if (oxR) oxR.position.set(2.2, 0, 0);
            if (dbL1) dbL1.position.set(-1.1, 0.2, 0);
            if (dbL2) dbL2.position.set(-1.1, -0.2, 0);
            if (dbR1) dbR1.position.set(1.1, 0.2, 0);
            if (dbR2) dbR2.position.set(1.1, -0.2, 0);
          }
        }

        // 30. Model 21: Human Heart Explorer
        if (modelSpec.functionalType === 'heart-explorer' || modelSpec.id === 'heart-explorer') {
          const bpm = parameters.heartRateBpm ?? 75;
          const f = bpm / 60;
          const phase = (simTime * f * Math.PI * 2) % (Math.PI * 2);
          const viewMode = conditions.inspectionView || 'internalCutaway';
          const showCutaway = viewMode === 'internalCutaway';
          const showFlow = conditions.showBloodFlow !== false || viewMode === 'flowAnimation';

          const peri = meshMap.get('pericardium-base');
          const ra = meshMap.get('right-atrium');
          const rv = meshMap.get('right-ventricle');
          const la = meshMap.get('left-atrium');
          const lv = meshMap.get('left-ventricle');
          const tv = meshMap.get('tricuspid-valve');
          const mv = meshMap.get('bicuspid-mitral-valve');
          const av = meshMap.get('aortic-valve');
          const pv = meshMap.get('pulmonary-valve');
          const deoxStream = meshMap.get('blood-flow-deox-stream');
          const oxStream = meshMap.get('blood-flow-ox-stream');

          if (peri) {
            if (showCutaway) {
              peri.scale.set(0.65, 0.9, 0.65);
              peri.position.set(0.1, -0.4, -0.4);
            } else {
              peri.scale.set(1.0, 1.0, 1.0);
              peri.position.set(0.1, -0.4, 0);
            }
          }

          let atriaScale = 1.0;
          let ventScale = 1.0;
          if (phase < Math.PI * 0.5) {
            atriaScale = 1.0 - 0.15 * Math.sin(phase * 2);
            ventScale = 1.0 + 0.08 * Math.sin(phase * 2);
            if (tv) tv.scale.set(1.15, 1.15, 1.15);
            if (mv) mv.scale.set(1.15, 1.15, 1.15);
            if (av) av.scale.set(0.85, 0.85, 0.85);
            if (pv) pv.scale.set(0.85, 0.85, 0.85);
          } else if (phase < Math.PI * 1.3) {
            ventScale = 1.0 - 0.18 * Math.sin((phase - Math.PI * 0.5) * 1.25);
            atriaScale = 1.0 + 0.05;
            if (tv) tv.scale.set(0.85, 0.85, 0.85);
            if (mv) mv.scale.set(0.85, 0.85, 0.85);
            if (av) av.scale.set(1.2, 1.2, 1.2);
            if (pv) pv.scale.set(1.2, 1.2, 1.2);
          } else {
            ventScale = 1.0;
            atriaScale = 1.0;
            if (tv) tv.scale.set(1.0, 1.0, 1.0);
            if (mv) mv.scale.set(1.0, 1.0, 1.0);
            if (av) av.scale.set(1.0, 1.0, 1.0);
            if (pv) pv.scale.set(1.0, 1.0, 1.0);
          }

          if (ra) ra.scale.set(atriaScale, atriaScale, atriaScale);
          if (la) la.scale.set(atriaScale, atriaScale, atriaScale);
          if (rv) rv.scale.set(ventScale, ventScale, ventScale);
          if (lv) lv.scale.set(ventScale, ventScale, ventScale);

          if (deoxStream) {
            deoxStream.visible = showFlow;
            const flowT = (simTime * f * 2.5) % 1.0;
            deoxStream.position.y = 0.35 + Math.sin(flowT * Math.PI) * 0.3;
          }
          if (oxStream) {
            oxStream.visible = showFlow;
            const flowT = ((simTime * f * 2.5) + 0.5) % 1.0;
            oxStream.position.y = 0.35 + Math.sin(flowT * Math.PI) * 0.3;
          }
        }

        // 31. Model 22: Human Respiratory System
        if (modelSpec.functionalType === 'respiratory-explorer' || modelSpec.id === 'respiratory-explorer') {
          const rr = parameters.breathingRate ?? 14;
          const vt = parameters.tidalVolume ?? 500;
          const f = rr / 60;
          const phase = (simTime * f * Math.PI * 2) % (Math.PI * 2);
          const viewMode = conditions.viewMode || 'fullSystem';
          const showGas = conditions.showGasVectors !== false;

          const rSup = meshMap.get('right-lung-superior');
          const rMid = meshMap.get('right-lung-middle');
          const rInf = meshMap.get('right-lung-inferior');
          const lSup = meshMap.get('left-lung-superior');
          const lInf = meshMap.get('left-lung-inferior');
          const dia = meshMap.get('diaphragm-dome');
          const alv = meshMap.get('alveolar-sac-enlarged');
          const cap = meshMap.get('pulmonary-capillary-mesh');
          const o2Vec = meshMap.get('o2-diffusion-vector');
          const co2Vec = meshMap.get('co2-diffusion-vector');

          const isMicro = viewMode === 'alveolusGasExchange';
          const isTree = viewMode === 'bronchialTree';

          if (alv) alv.visible = isMicro || !isTree;
          if (cap) cap.visible = isMicro || !isTree;
          if (o2Vec) o2Vec.visible = isMicro && showGas;
          if (co2Vec) co2Vec.visible = isMicro && showGas;

          const lungOpacity = isTree ? 0.2 : (isMicro ? 0.35 : 1.0);
          [rSup, rMid, rInf, lSup, lInf].forEach(lung => {
            if (lung && (lung as THREE.Mesh).material) {
              const mat = (lung as THREE.Mesh).material as THREE.Material;
              mat.transparent = true;
              mat.opacity = lungOpacity;
            }
          });

          const breathExpansion = 1.0 + (vt / 2500) * (Math.sin(phase) * 0.5 + 0.5) * 0.18;
          const diaShift = -1.9 - (vt / 1500) * (Math.sin(phase) * 0.5 + 0.5) * 0.35;

          if (rSup) rSup.scale.set(breathExpansion, breathExpansion, breathExpansion);
          if (rMid) rMid.scale.set(breathExpansion, breathExpansion, breathExpansion);
          if (rInf) rInf.scale.set(breathExpansion, breathExpansion, breathExpansion);
          if (lSup) lSup.scale.set(breathExpansion, breathExpansion, breathExpansion);
          if (lInf) lInf.scale.set(breathExpansion, breathExpansion, breathExpansion);
          if (dia) dia.position.y = diaShift;

          if (isMicro) {
            if (o2Vec) {
              const o2T = (simTime * 2.0) % 1.0;
              o2Vec.position.set(0.45 - o2T * 0.35, 0.45 - o2T * 0.3, 2.3 - o2T * 0.3);
            }
            if (co2Vec) {
              const co2T = (simTime * 2.0 + 0.5) % 1.0;
              co2Vec.position.set(-0.45 + co2T * 0.35, -0.25 + co2T * 0.3, 2.3 + co2T * 0.3);
            }
          }
        }

        // 32. Model 23: Human Digestive System
        if (modelSpec.functionalType === 'digestive-system' || modelSpec.id === 'digestive-system') {
          const pSpeed = parameters.peristalsisSpeed ?? 1.0;
          const viewMode = conditions.viewMode || 'fullTract';
          const showFood = conditions.showFoodPath !== false;

          const bolus = meshMap.get('food-bolus-particle');
          const rugae = meshMap.get('stomach-rugae-cutaway');
          const villus = meshMap.get('intestinal-villus-enlarged');
          const lacteal = meshMap.get('villus-capillary-lacteal');
          const stomach = meshMap.get('stomach-body');

          const isVilli = viewMode === 'villiAbsorption';
          const isStomachCut = viewMode === 'stomachCutaway';

          if (villus) villus.visible = isVilli;
          if (lacteal) lacteal.visible = isVilli;
          if (rugae) rugae.visible = isStomachCut || !isVilli;

          if (bolus) {
            bolus.visible = showFood && !isVilli;
            const waypoints = [
              new THREE.Vector3(0, 3.1, 0.2),
              new THREE.Vector3(0, 1.8, 0.05),
              new THREE.Vector3(0.35, 0.15, 0.15),
              new THREE.Vector3(-0.35, -0.7, 0.25),
              new THREE.Vector3(0, -1.4, 0.2),
              new THREE.Vector3(-1.2, -1.9, 0.15),
              new THREE.Vector3(-1.25, -1.0, 0.1),
              new THREE.Vector3(0.0, -0.3, 0.45),
              new THREE.Vector3(1.25, -1.15, 0.1),
              new THREE.Vector3(0.0, -2.4, -0.1),
            ];
            const totalW = waypoints.length - 1;
            const progress = ((simTime * pSpeed * 0.15) % 1.0) * totalW;
            const idx = Math.floor(progress);
            const frac = progress - idx;
            const p1 = waypoints[idx];
            const p2 = waypoints[Math.min(idx + 1, totalW)];
            bolus.position.lerpVectors(p1, p2, frac);
          }

          if (stomach && (isStomachCut || conditions.digestivePhase === 'gastricDigestion')) {
            const churn = 1.0 + Math.sin(simTime * 3.0) * 0.04;
            stomach.scale.set(churn, 1.0, churn);
          }
        }

        // 33. Model 24: Human Brain Explorer
        if (modelSpec.functionalType === 'brain-explorer' || modelSpec.id === 'brain-explorer') {
          const f = parameters.actionPotentialFreq ?? 35;
          const sep = (parameters.cutawaySeparation ?? 0) / 10;
          const viewMode = conditions.viewMode || 'fullBrain';
          const showImpulse = conditions.showImpulses !== false;

          const fLobe = meshMap.get('frontal-lobe-cortex');
          const pLobe = meshMap.get('parietal-lobe-cortex');
          const tLobe = meshMap.get('temporal-lobe-cortex');
          const oLobe = meshMap.get('occipital-lobe-cortex');
          const cc = meshMap.get('corpus-callosum-arch');
          const thal = meshMap.get('thalamus-relay');
          const hypo = meshMap.get('hypothalamus-pituitary');
          const hippo = meshMap.get('hippocampus-gyrus');
          const vent = meshMap.get('lateral-ventricle-cavity');
          const neuron = meshMap.get('neuron-soma-axon');
          const bouton = meshMap.get('synaptic-terminal-bouton');
          const spine = meshMap.get('synaptic-cleft-receptor');
          const impulse = meshMap.get('action-potential-impulse');

          const isMicro = viewMode === 'neuronSynapse';
          const isCross = viewMode === 'crossSection';

          if (neuron) neuron.visible = isMicro;
          if (bouton) bouton.visible = isMicro;
          if (spine) spine.visible = isMicro;
          if (impulse) impulse.visible = isMicro && showImpulse;

          if (cc) cc.visible = isCross || isMicro || sep > 0.05;
          if (thal) thal.visible = isCross || isMicro || sep > 0.05;
          if (hypo) hypo.visible = isCross || isMicro || sep > 0.05;
          if (hippo) hippo.visible = isCross || isMicro || sep > 0.05;
          if (vent) vent.visible = isCross || isMicro || sep > 0.05;

          if (fLobe && !isMicro) fLobe.position.x = sep;
          if (pLobe && !isMicro) pLobe.position.x = sep;
          if (tLobe && !isMicro) tLobe.position.x = sep;
          if (oLobe && !isMicro) oLobe.position.x = -sep;

          if (isMicro && impulse) {
            const pulseT = (simTime * (f / 15)) % 1.0;
            impulse.position.set(-0.35 + pulseT * 0.7, -0.45, 2.3);
          }
        }

        // 34. Model 25: Human Eye and Vision
        if (modelSpec.functionalType === 'eye-vision' || modelSpec.id === 'eye-vision') {
          const pLens = parameters.lensPowerDiopters ?? 20;
          const pPupil = parameters.pupilDiameterMm ?? 4.0;
          const viewMode = conditions.viewMode || 'sagittalCutaway';
          const refState = conditions.refractionState || 'emmetropia';
          const showRays = conditions.showLightRayTraces !== false;

          const lens = meshMap.get('crystalline-lens');
          const pupil = meshMap.get('pupil-aperture');
          const rays = meshMap.get('incident-light-ray-cone');
          const invImg = meshMap.get('inverted-retinal-image');
          const sclera = meshMap.get('sclera-outer-shell');
          const choroid = meshMap.get('choroid-vascular-layer');
          const rodsCones = meshMap.get('photoreceptor-rod-cone');

          const isCutaway = viewMode === 'sagittalCutaway';
          const isMicro = viewMode === 'photoreceptors';

          if (rodsCones) rodsCones.visible = isMicro;

          if (sclera && (sclera as THREE.Mesh).material) {
            const mat = (sclera as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = isCutaway ? 0.35 : 1.0;
          }
          if (choroid && (choroid as THREE.Mesh).material) {
            const mat = (choroid as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = isCutaway ? 0.4 : 1.0;
          }

          if (lens) {
            const lensThickness = 0.85 + (pLens - 20) * 0.03;
            lens.scale.set(1.0, 1.0, lensThickness);
          }

          if (pupil) {
            const pupilScale = pPupil / 4.0;
            pupil.scale.set(pupilScale, pupilScale, 1.0);
          }

          if (invImg) {
            invImg.visible = showRays && !isMicro;
            let focusZ = -1.85;
            if (refState === 'myopia') focusZ = -1.55;
            if (refState === 'hyperopia') focusZ = -2.15;
            invImg.position.z = focusZ;
            const shimmer = 1.0 + Math.sin(simTime * 4.0) * 0.05;
            invImg.scale.set(shimmer, shimmer, shimmer);
          }
          if (rays) {
            rays.visible = showRays && !isMicro;
          }
        }

        // 35. Model 26: Plant Cell Explorer
        if (modelSpec.functionalType === 'plant-cell-explorer' || modelSpec.id === 'plant-cell-explorer') {
          const sep = parameters.organelleSeparation ?? 0;
          const turgor = (parameters.turgorPressure ?? 85) / 100;
          const viewMode = conditions.viewMode || 'cutaway';
          const isMicro = viewMode === 'enlargedChloroplast';
          const isCutaway = viewMode === 'cutaway';

          const wall = meshMap.get('plant-cell-wall');
          const membrane = meshMap.get('plant-cell-membrane');
          const vacuole = meshMap.get('plant-central-vacuole');
          const chloroCut = meshMap.get('enlarged-chloroplast-cutaway');
          const grana = meshMap.get('grana-thylakoid-stack');
          const stroma = meshMap.get('stroma-fluid-chamber');

          if (vacuole) {
            const vScale = 0.6 + turgor * 0.55;
            vacuole.scale.set(vScale, vScale * 1.1, vScale);
          }

          if (wall && (wall as THREE.Mesh).material) {
            const mat = (wall as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = isCutaway ? 0.25 : (isMicro ? 0.15 : 0.45);
          }
          if (membrane && (membrane as THREE.Mesh).material) {
            const mat = (membrane as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = isCutaway ? 0.3 : (isMicro ? 0.15 : 0.55);
          }

          if (chloroCut) chloroCut.visible = isMicro;
          if (grana) grana.visible = isMicro;
          if (stroma) stroma.visible = isMicro;

          if (sep > 0) {
            const orgIds = ['plant-nucleus', 'chloroplast-1', 'chloroplast-2', 'chloroplast-3', 'plant-mitochondria-1', 'plant-mitochondria-2', 'plant-endoplasmic-reticulum', 'plant-golgi'];
            orgIds.forEach((id) => {
              const mesh = meshMap.get(id);
              if (mesh && mesh.userData.basePosition) {
                const base = mesh.userData.basePosition as THREE.Vector3;
                mesh.position.copy(base.clone().multiplyScalar(1.0 + sep * 1.5));
              }
            });
          }

          const c1 = meshMap.get('chloroplast-1');
          const c2 = meshMap.get('chloroplast-2');
          const c3 = meshMap.get('chloroplast-3');
          if (c1 && !isMicro) c1.rotation.y += delta * 0.4;
          if (c2 && !isMicro) c2.rotation.y += delta * 0.4;
          if (c3 && !isMicro) c3.rotation.y += delta * 0.4;
        }

        // 36. Model 27: Animal Cell Explorer
        if (modelSpec.functionalType === 'animal-cell-explorer' || modelSpec.id === 'animal-cell-explorer') {
          const sep = parameters.organelleSeparation ?? 0;
          const rate = (parameters.metabolicRate ?? 100) / 100;
          const viewMode = conditions.viewMode || 'cutaway';
          const isMicro = viewMode === 'enlargedMitochondrion';
          const isCutaway = viewMode === 'cutaway';

          const membrane = meshMap.get('animal-plasma-membrane');
          const mitoCut = meshMap.get('enlarged-mitochondrion-cutaway');
          const cristae = meshMap.get('mitochondrial-cristae-folds');

          if (membrane && (membrane as THREE.Mesh).material) {
            const mat = (membrane as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = isCutaway ? 0.25 : (isMicro ? 0.15 : 0.45);
          }

          if (mitoCut) mitoCut.visible = isMicro;
          if (cristae) cristae.visible = isMicro;

          if (sep > 0) {
            const orgIds = ['animal-nucleus', 'animal-mitochondria-1', 'animal-mitochondria-2', 'animal-mitochondria-3', 'animal-rough-er', 'animal-smooth-er', 'animal-golgi', 'animal-lysosome-1', 'animal-lysosome-2', 'animal-centrosome'];
            orgIds.forEach((id) => {
              const mesh = meshMap.get(id);
              if (mesh && mesh.userData.basePosition) {
                const base = mesh.userData.basePosition as THREE.Vector3;
                mesh.position.copy(base.clone().multiplyScalar(1.0 + sep * 1.5));
              }
            });
          }

          const m1 = meshMap.get('animal-mitochondria-1');
          const m2 = meshMap.get('animal-mitochondria-2');
          const mPulse = 1.0 + Math.sin(simTime * 2.5 * rate) * 0.05;
          if (m1 && !isMicro) m1.scale.set(mPulse, mPulse, mPulse);
          if (m2 && !isMicro) m2.scale.set(mPulse, mPulse, mPulse);
        }

        // 37. Model 28: Plant Root and Transport Explorer
        if (modelSpec.functionalType === 'plant-root-transport' || modelSpec.id === 'plant-root-transport') {
          const tRate = (parameters.transpirationRate ?? 100) / 100;
          const viewMode = conditions.viewMode || 'rootCrossSection';
          const focus = conditions.transportFocus || 'dualFlow';
          const showArrows = conditions.showFlowArrows !== false;

          const disc = meshMap.get('root-cross-section-disc');
          const hairMicro = meshMap.get('enlarged-root-hair-cell');
          const soil = meshMap.get('soil-particles-matrix');
          const xylem = meshMap.get('xylem-flow-stream');
          const phloem = meshMap.get('phloem-flow-stream');

          const isMicro = viewMode === 'rootHairMicro';
          const isCross = viewMode === 'rootCrossSection';

          if (hairMicro) hairMicro.visible = isMicro;
          if (soil) soil.visible = isMicro;
          if (disc) disc.visible = isCross || !isMicro;

          if (xylem) {
            xylem.visible = showArrows && !isMicro && focus !== 'phloemOnly';
            const yFlow = ((simTime * tRate * 1.5) % 1.0) * 0.6;
            xylem.position.y = 0.6 + yFlow;
          }
          if (phloem) {
            phloem.visible = showArrows && !isMicro && focus !== 'xylemOnly';
            const yFlow = ((simTime * tRate * 1.0) % 1.0) * 0.6;
            phloem.position.y = 0.6 - yFlow;
          }
        }

        // 38. Model 29: Blood and Circulation Microscope
        if (modelSpec.functionalType === 'blood-circulation-microscope' || modelSpec.id === 'blood-circulation-microscope') {
          const vel = parameters.bloodFlowVelocity ?? 1.0;
          const clotProg = (parameters.clottingProgress ?? 0) / 100;
          const viewMode = conditions.viewMode || 'capillaryFlow';
          const showAnim = conditions.showFlowAnimation !== false;

          const r1 = meshMap.get('rbc-erythrocyte-1');
          const r2 = meshMap.get('rbc-erythrocyte-2');
          const r3 = meshMap.get('rbc-erythrocyte-3');
          const r4 = meshMap.get('rbc-erythrocyte-4');
          const wbc = meshMap.get('wbc-leukocyte-neutrophil');
          const p1 = meshMap.get('platelet-thrombocyte-1');
          const p2 = meshMap.get('platelet-thrombocyte-2');
          const smear = meshMap.get('enlarged-erythrocyte-cutaway');
          const clotMesh = meshMap.get('fibrin-mesh-clot');
          const trapped = meshMap.get('trapped-clot-erythrocytes');

          const isSmear = viewMode === 'bloodSmear';
          const isClot = viewMode === 'clottingCascade';

          if (smear) smear.visible = isSmear;
          if (clotMesh) {
            clotMesh.visible = isClot || clotProg > 0.1;
            const clotScale = Math.max(0.01, clotProg);
            clotMesh.scale.set(clotScale, clotScale, clotScale);
          }
          if (trapped) trapped.visible = isClot || clotProg > 0.2;

          if (showAnim && !isSmear) {
            const shiftX = (delta * vel * 2.5);
            [r1, r2, r3, r4, wbc, p1, p2].forEach((cell) => {
              if (cell) {
                cell.position.x += shiftX;
                if (cell.position.x > 3.0) cell.position.x = -3.0;
                cell.rotation.x += delta * 1.5;
                cell.rotation.y += delta * 1.2;
              }
            });
          }
        }

        // 38B. Blood Transport — Internal Circulatory System
        if (modelSpec.functionalType === 'blood-transport' || modelSpec.id === 'blood-transport') {
          const bpm = (parameters.heartRateBpm as number) || 72;
          const flowVel = (parameters.bloodFlowVelocity as number) || 1.0;
          const viewMode = (conditions.viewMode as string) || 'completeCirculation';
          const showFlow = conditions.showDirectionalFlow !== false;
          const colorStd = (conditions.colorCodingStandard as string) || 'educationalStandard';

          // 1. Cardiac Cycle Ventricular & Atrial Pumping
          const cardiacFreq = bpm / 60; // cycles per second
          const cycleProgress = (simTime * cardiacFreq) % 1.0; // 0.0 to 1.0

          // Ventricular Systole (ejection phase 0.0 - 0.35)
          const lv = meshMap.get('heart-left-ventricle');
          const rv = meshMap.get('heart-right-ventricle');
          const la = meshMap.get('heart-left-atrium');
          const ra = meshMap.get('heart-right-atrium');

          if (lv && rv) {
            let vSqueeze = 0;
            if (cycleProgress < 0.35) {
              vSqueeze = Math.sin((cycleProgress / 0.35) * Math.PI) * 0.12;
            }
            lv.scale.set(1.0 - vSqueeze, 1.0 - vSqueeze * 0.8, 1.0 - vSqueeze);
            rv.scale.set(1.0 - vSqueeze * 0.9, 1.0 - vSqueeze * 0.8, 1.0 - vSqueeze * 0.9);
          }

          // Atrial Systole (filling phase 0.70 - 0.95)
          if (la && ra) {
            let aSqueeze = 0;
            if (cycleProgress >= 0.70 && cycleProgress < 0.95) {
              aSqueeze = Math.sin(((cycleProgress - 0.70) / 0.25) * Math.PI) * 0.10;
            }
            la.scale.set(1.0 - aSqueeze, 1.0 - aSqueeze, 1.0 - aSqueeze);
            ra.scale.set(1.0 - aSqueeze, 1.0 - aSqueeze, 1.0 - aSqueeze);
          }

          // 2. View Mode Filtering
          const isPulmonaryOnly = viewMode === 'pulmonaryCircuit';
          const isSystemicOnly = viewMode === 'systemicCircuit';
          const isHeartOnly = viewMode === 'heartOnly';

          // Mesh visibility filtering for standard parts
          const lungLeft = meshMap.get('pulmonary-capillary-bed-left');
          const lungRight = meshMap.get('pulmonary-capillary-bed-right');
          const cranialBed = meshMap.get('systemic-capillaries-cranial');
          const lowerBed = meshMap.get('systemic-capillaries-lower');

          if (lungLeft) lungLeft.visible = !isSystemicOnly && !isHeartOnly;
          if (lungRight) lungRight.visible = !isSystemicOnly && !isHeartOnly;
          if (cranialBed) cranialBed.visible = !isPulmonaryOnly && !isHeartOnly;
          if (lowerBed) lowerBed.visible = !isPulmonaryOnly && !isHeartOnly;

          // Auxiliary vascular tubes visibility & colorStandard
          circulatoryVessels.forEach((v) => {
            if (isHeartOnly) {
              v.mesh.visible = false;
            } else if (isPulmonaryOnly) {
              v.mesh.visible = v.circuit === 'pulmonary';
            } else if (isSystemicOnly) {
              v.mesh.visible = v.circuit === 'systemic';
            } else {
              v.mesh.visible = true;
            }

            // Realistic dark maroon venous blood vs educational blue
            if (colorStd === 'realisticCrimson' && v.bloodType === 'deoxygenated') {
              (v.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x6b1d2f);
            } else {
              (v.mesh.material as THREE.MeshStandardMaterial).color.setHex(v.defaultColor);
            }
          });

          // 3. Directional Blood Flow Pulses Animation
          circulatoryFlowPulses.forEach((pulse) => {
            const shouldShow =
              showFlow &&
              !isHeartOnly &&
              (!isPulmonaryOnly || pulse.circuit === 'pulmonary') &&
              (!isSystemicOnly || pulse.circuit === 'systemic');

            pulse.marker.visible = shouldShow;
            if (shouldShow) {
              const t = (simTime * pulse.speed * flowVel + pulse.offset) % 1.0;
              const pos = pulse.curve.getPointAt(t);
              const tangent = pulse.curve.getTangentAt(t);
              pulse.marker.position.copy(pos);
              pulse.marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

              // Color update: Blue in educational, crimson in realistic
              if (colorStd === 'realisticCrimson' && pulse.bloodType === 'deoxygenated') {
                (pulse.marker.material as THREE.MeshBasicMaterial).color.setHex(0x991b1b);
              } else if (pulse.bloodType === 'deoxygenated') {
                (pulse.marker.material as THREE.MeshBasicMaterial).color.setHex(0x60a5fa);
              } else {
                (pulse.marker.material as THREE.MeshBasicMaterial).color.setHex(0xf87171);
              }
            }
          });
        }

        // 39. Model 30: Neuron and Nerve Signal Explorer
        if (modelSpec.functionalType === 'neuron-nerve-signal' || modelSpec.id === 'neuron-nerve-signal') {
          const vel = (parameters.impulseVelocity ?? 80) / 40;
          const viewMode = conditions.viewMode || 'wholeNeuron';
          const showWave = conditions.showSignalWave !== false;

          const pulse = meshMap.get('electrical-signal-pulse');
          const pre = meshMap.get('enlarged-synapse-presynaptic');
          const cleft = meshMap.get('synaptic-cleft-gap');
          const post = meshMap.get('postsynaptic-dendritic-spine');
          const nt = meshMap.get('neurotransmitter-molecules-cloud');

          const isSynapse = viewMode === 'chemicalSynapse';

          if (pre) pre.visible = isSynapse;
          if (cleft) cleft.visible = isSynapse;
          if (post) post.visible = isSynapse;
          if (nt) {
            nt.visible = isSynapse;
            const diffT = (simTime * 2.5) % 1.0;
            nt.position.x = -0.3 + diffT * 0.6;
          }

          if (pulse) {
            pulse.visible = showWave && !isSynapse;
            const waveProgress = ((simTime * vel * 0.8) % 1.0) * 4.8;
            pulse.position.x = -1.4 + waveProgress;
            const pScale = 1.0 + Math.sin(simTime * 8.0) * 0.15;
            pulse.scale.set(pScale, pScale, pScale);
          }
        }

        // 40. Model 31: AC Electric Generator
        if (modelSpec.functionalType === 'ac-generator' || modelSpec.id === 'ac-generator') {
          const rpm = parameters.rotationSpeedRpm ?? parameters.rotationSpeed ?? 120;
          const B = parameters.magneticFieldStrength ?? parameters.magneticField ?? 2.0;
          const turns = parameters.coilTurns ?? 50;
          const omega = (rpm * Math.PI * 2) / 60;
          const internalOn = Boolean(conditions.internalView);
          const showField = conditions.showFieldLines !== false;

          const housing = meshMap.get('stator-housing');
          const shaft = meshMap.get('central-drive-shaft') ?? meshMap.get('rotor-shaft');
          const coil = meshMap.get('rotor-armature-coil') ?? meshMap.get('armature-coil');
          const ring1 = meshMap.get('slip-ring-inner') ?? meshMap.get('slip-ring-1');
          const ring2 = meshMap.get('slip-ring-outer') ?? meshMap.get('slip-ring-2');
          const bulb = meshMap.get('output-indicator-bulb') ?? meshMap.get('output-meter');
          const fieldLines = meshMap.get('magnetic-field-lines');

          // Internal cutaway toggle
          if (housing) {
            const mat = (housing as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (internalOn) {
              mat.transparent = true;
              mat.opacity = 0.2;
              mat.wireframe = false;
            } else {
              mat.transparent = false;
              mat.opacity = 0.85;
            }
          }

          // Armature rotation
          const rotAngle = (simTime * omega) % (Math.PI * 2);
          if (shaft) shaft.rotation.x = rotAngle;
          if (coil) coil.rotation.x = rotAngle;
          if (ring1) ring1.rotation.x = rotAngle;
          if (ring2) ring2.rotation.x = rotAngle;

          // Induced EMF & output load pulsation: E(t) = N * B * A * omega * sin(omega * t)
          const inducedSin = Math.sin(rotAngle);
          const powerLevel = Math.min(1.0, (turns * B * (rpm / 120)) / 100);
          if (bulb) {
            const glowIntensity = 0.15 + (inducedSin * inducedSin) * 0.85 * powerLevel;
            const bMat = (bulb as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (bMat && bMat.emissive) {
              bMat.emissive.setHex(0xfacc15);
              bMat.emissiveIntensity = glowIntensity;
            }
          }
          if (fieldLines) {
            fieldLines.visible = showField;
          }
        }

        // 42. Model 33: Electromagnetic Induction Explorer
        if (modelSpec.functionalType === 'electromagnetic-induction' || modelSpec.id === 'electromagnetic-induction') {
          const vel = parameters.magnetVelocity ?? parameters.magnetSpeed ?? 1.0;
          const turns = parameters.coilLoops ?? parameters.coilTurns ?? 30;
          const B = parameters.magnetStrength ?? 500;
          const reversed = Boolean(conditions.magnetReversed) || conditions.magnetOrientation === 'southFirst';
          const internalOn = Boolean(conditions.internalView);

          const magnet = meshMap.get('bar-magnet-probe') ?? meshMap.get('moving-bar-magnet');
          const southCap = meshMap.get('magnet-south-cap');
          const wand = meshMap.get('magnet-handling-wand');
          const solenoid = meshMap.get('conducting-solenoid-coil') ?? meshMap.get('solenoid-coil');
          const needle = meshMap.get('galvanometer-needle');
          const opposingField = meshMap.get('opposing-induced-field') ?? meshMap.get('induced-current-arrows');

          if (solenoid) {
            const mat = (solenoid as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (internalOn) {
              mat.transparent = true;
              mat.opacity = 0.35;
            } else {
              mat.transparent = false;
              mat.opacity = 1.0;
            }
          }

          // Magnet translation oscillation
          const oscFreq = vel * 1.8;
          const xOffset = Math.sin(simTime * oscFreq) * 1.8;
          const vx = Math.cos(simTime * oscFreq) * 1.8 * oscFreq; // Rate of change dPhi/dt

          if (magnet) {
            magnet.position.x = -0.4 + xOffset;
            magnet.rotation.y = reversed ? Math.PI : 0;
          }
          if (southCap) {
            southCap.position.x = (reversed ? 0.5 : -1.3) + xOffset;
          }
          if (wand) wand.position.x = -2.0 + xOffset;

          // Galvanometer deflection: Faraday's law EMF = -N dPhi/dt
          const poleSign = reversed ? -1 : 1;
          const bNorm = B > 10 ? B / 500 : B;
          const deflection = Math.max(-0.65, Math.min(0.65, -vx * (turns / 30) * bNorm * 0.25 * poleSign));

          if (needle) {
            needle.rotation.z = deflection;
          }

          // Lenz law opposing field reaction
          if (opposingField) {
            opposingField.visible = Math.abs(vx) > 0.3;
            const opMat = (opposingField as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (opMat && opMat.emissive) {
              opMat.emissiveIntensity = Math.min(1.0, Math.abs(vx) * 0.5);
            }
          }
        }

        // 45. Model 36: Heat Transfer Explorer (Scientifically Consistent Simulation)
        if (modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer') {
          const Th = parameters.heatSourceTempC ?? parameters.heatSourceTemp ?? 200;
          const Tamb = parameters.initialTempC ?? 20;
          const k = parameters.thermalConductivity ?? 390;
          const eps = parameters.radiationEmissivity ?? 0.85;
          const mode = (conditions.transferMode || 'conduction') as 'conduction' | 'convection' | 'radiation';
          const selectedMaterialKey = conditions.rodMaterial || 'copper';
          const matSpec = HEAT_MATERIALS[selectedMaterialKey] || HEAT_MATERIALS.copper;

          const heater = meshMap.get('thermal-heat-source') ?? meshMap.get('heat-source-burner');
          const rodDefaultMesh = meshMap.get('conduction-metal-rod') ?? meshMap.get('conduction-rod');
          const flask = meshMap.get('convection-fluid-vessel') ?? meshMap.get('convection-chamber');
          const cUp = meshMap.get('convection-current-up') ?? meshMap.get('convection-rising-arrow');
          const cDown = meshMap.get('convection-current-down') ?? meshMap.get('convection-sinking-arrow');
          const radEmitter = meshMap.get('radiation-emitter-plate');
          const radReceiver = meshMap.get('radiation-detector-plate');
          const radWaveOld = meshMap.get('radiation-wave-1');
          if (radWaveOld) radWaveOld.visible = false;

          // Check if reset was requested
          if (heatTransferSimRef.current.resetCounter !== heatRestartCounterRef.current) {
            heatTransferSimRef.current.conductionState = createConductionState(12, Tamb);
            heatTransferSimRef.current.radiationSimTime = 0;
            heatTransferSimRef.current.convectionPhase = 0;
            heatTransferSimRef.current.radiationWavePhase = 0;
            heatTransferSimRef.current.resetCounter = heatRestartCounterRef.current;
          }

          // Step physical simulation state forward in time (only when active and playing!)
          if (isPlaying) {
            const dtSim = Math.min(delta, 0.05);

            // 1. Conduction 1D transient finite difference diffusion
            heatTransferSimRef.current.conductionState = stepConduction(
              heatTransferSimRef.current.conductionState,
              dtSim,
              Th,
              k,
              Tamb
            );

            // 2. Convection buoyancy circulation phase
            const convRate = calculateConvectionMetrics(Th, Tamb).fluidVelocityMs;
            heatTransferSimRef.current.convectionPhase += dtSim * (convRate * 3.5);

            // 3. Radiation elapsed time & wavefront propagation
            heatTransferSimRef.current.radiationSimTime += dtSim;
            heatTransferSimRef.current.radiationWavePhase += dtSim * 1.5;
          }

          // Current calculated metrics across all 3 physics modes
          const currentCondState = heatTransferSimRef.current.conductionState;
          const convMetrics = calculateConvectionMetrics(Th, Tamb);
          const radMetrics = calculateRadiationMetrics(Th, eps, heatTransferSimRef.current.radiationSimTime, Tamb);

          // 1. Ceramic Heat Source (Heater)
          if (heater) {
            const hMat = (heater as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (hMat && hMat.emissive) {
              const heaterCol = getTemperatureHexColor(Th, Tamb, 500);
              hMat.color.set(heaterCol);
              hMat.emissive.set(heaterCol);
              hMat.emissiveIntensity = 0.35 + (Math.max(0, Th - Tamb) / 500) * 0.75;
            }
          }

          // 2. Solid Conduction Bar (12 discrete segments + thermometer probes)
          const isConductionActive = mode === 'conduction';
          if (rodDefaultMesh) {
            // Hide default uniform cylinder; display our segmented physical bar
            rodDefaultMesh.visible = false;
          }

          heatRodSegments.forEach((segMesh, idx) => {
            segMesh.visible = isConductionActive;
            if (isConductionActive) {
              const segTemp = currentCondState.temperatures[idx] ?? Tamb;
              const segHex = getTemperatureHexColor(segTemp, Tamb, 500);
              const mat = segMesh.material as THREE.MeshStandardMaterial;
              if (mat) {
                mat.color.set(segHex);
                mat.emissive.set(segHex);
                mat.emissiveIntensity = Math.min(0.85, (segTemp - Tamb) / 480 * 0.85);
              }
            }
          });

          // Thermometer probe beads: match exact calculated temperatures at nodes 0, 3, 6, 9, 11
          const probeIndices = [0, 3, 6, 9, 11];
          heatProbeBeads.forEach((bead, pIdx) => {
            bead.visible = isConductionActive;
            if (isConductionActive) {
              const nodeIdx = probeIndices[pIdx];
              const pTemp = currentCondState.temperatures[nodeIdx] ?? Tamb;
              const bHex = getTemperatureHexColor(pTemp, Tamb, 500);
              const bMat = bead.material as THREE.MeshStandardMaterial;
              if (bMat) {
                bMat.color.set(bHex);
                bMat.emissive.set(bHex);
                bMat.emissiveIntensity = 0.3 + ((pTemp - Tamb) / 480) * 0.7;
              }
            }
          });

          // Heat flux vector arrow: points from high temperature (left) toward low temperature (right)
          if (heatFluxArrow) {
            heatFluxArrow.visible = isConductionActive && Th > Tamb;
            const fluxIntensity = Math.min(1.0, (Th - Tamb) / 300);
            heatFluxArrow.setLength(2.2 * (0.4 + 0.6 * fluxIntensity), 0.28, 0.14);
          }

          // Wax conduction markers: melt and droop sequentially when local rod node temperature exceeds 62°C (paraffin melting point)
          const waxIds = ['wax-marker-1', 'wax-marker-2', 'wax-marker-3'];
          const waxNodes = [2, 6, 10];
          waxIds.forEach((wId, wIdx) => {
            const waxMesh = meshMap.get(wId);
            if (waxMesh) {
              waxMesh.visible = isConductionActive;
              const nodeT = currentCondState.temperatures[waxNodes[wIdx]] ?? Tamb;
              const meltFactor = Math.max(0, Math.min(1, (nodeT - 60) / 40));
              waxMesh.position.y = -0.35 - meltFactor * 0.55;
              waxMesh.scale.set(1.0 - meltFactor * 0.35, 1.0 + meltFactor * 0.4, 1.0 - meltFactor * 0.35);
            }
          });

          // 3. Fluid Convection (Buoyant circulation streamlines)
          const isConvectionActive = mode === 'convection';
          if (flask) {
            flask.visible = isConvectionActive;
          }
          if (cUp) cUp.visible = false;
          if (cDown) cDown.visible = false;

          const convPhase = heatTransferSimRef.current.convectionPhase;
          heatConvectionTracers.forEach((tracer, tIdx) => {
            tracer.visible = isConvectionActive && convMetrics.deltaTempC > 0;
            if (isConvectionActive) {
              // 8 tracers on Left vortex roll, 8 tracers on Right vortex roll
              const isRightRoll = tIdx >= 8;
              const subIdx = tIdx % 8;
              const normPhase = (convPhase + subIdx / 8) % 1.0;

              // Parametric rectangular/rounded convective circulation path:
              // Phase 0.0 -> 0.35: Rising buoyant central plume (y: -1.2 -> 0.45)
              // Phase 0.35 -> 0.50: Top divergent outward spread (x: 0.2 -> -0.4 or +0.8)
              // Phase 0.50 -> 0.85: Sinking cool wall plume (y: 0.45 -> -1.2)
              // Phase 0.85 -> 1.0: Bottom convergent return toward center (x: wall -> 0.2)
              let tx = 0.2;
              let ty = -1.2;
              const wallX = isRightRoll ? 0.8 : -0.4;
              let tracerTemp = Tamb;

              if (normPhase < 0.35) {
                // Rising warm fluid
                const p = normPhase / 0.35;
                tx = 0.2 + (isRightRoll ? 0.08 : -0.08) * (1 - p);
                ty = -1.2 + p * 1.65;
                tracerTemp = convMetrics.risingPlumeTempC;
              } else if (normPhase < 0.50) {
                // Top surface cooling & diverging
                const p = (normPhase - 0.35) / 0.15;
                tx = 0.2 + p * (wallX - 0.2);
                ty = 0.45;
                tracerTemp = convMetrics.topSurfaceTempC;
              } else if (normPhase < 0.85) {
                // Sinking cool dense fluid along wall
                const p = (normPhase - 0.50) / 0.35;
                tx = wallX;
                ty = 0.45 - p * 1.65;
                tracerTemp = convMetrics.sinkingReturnTempC;
              } else {
                // Bottom return to heater
                const p = (normPhase - 0.85) / 0.15;
                tx = wallX + p * (0.2 - wallX);
                ty = -1.2;
                tracerTemp = convMetrics.risingPlumeTempC * 0.9;
              }

              tracer.position.set(tx, ty, 0.8);
              const tMat = tracer.material as THREE.MeshStandardMaterial;
              if (tMat) {
                const col = getTemperatureHexColor(tracerTemp, Tamb, 500);
                tMat.color.set(col);
                tMat.emissive.set(col);
                tMat.emissiveIntensity = 0.4 + ((tracerTemp - Tamb) / 480) * 0.6;
              }
            }
          });

          // 4. Electromagnetic Thermal Radiation (Non-contact infrared waves)
          const isRadiationActive = mode === 'radiation';
          if (radEmitter) {
            radEmitter.visible = isRadiationActive;
            const eMat = (radEmitter as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (eMat && eMat.emissive) {
              const eHex = getTemperatureHexColor(Th, Tamb, 500);
              eMat.emissive.set(eHex);
              eMat.emissiveIntensity = 0.25 + (Math.max(0, Th - Tamb) / 500) * 0.75;
            }
          }

          if (radReceiver) {
            radReceiver.visible = isRadiationActive;
            const rMat = (radReceiver as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (rMat) {
              // Receiver absorbs radiant energy over time and warms up from ambient!
              const rHex = getTemperatureHexColor(radMetrics.absorbedReceiverTempC, Tamb, 500);
              rMat.color.set(rHex);
              if (rMat.emissive) {
                rMat.emissive.set(rHex);
                rMat.emissiveIntensity = Math.min(0.65, (radMetrics.absorbedReceiverTempC - Tamb) / 200);
              }
            }
          }

          // Radiation wavefront arcs travelling across the gap
          const radWavePhase = heatTransferSimRef.current.radiationWavePhase;
          heatRadiationWaves.forEach((waveMesh, wIdx) => {
            waveMesh.visible = isRadiationActive && Th > Tamb;
            if (isRadiationActive) {
              const wPhase = (radWavePhase + wIdx * 0.2) % 1.0;
              // Propagate along X from emitter (x = -1.0) to receiver (x = 1.0)
              const waveX = -1.0 + wPhase * 2.0;
              waveMesh.position.x = waveX;
              // Expand slightly
              const scale = 0.6 + wPhase * 0.45;
              waveMesh.scale.set(scale, scale, scale);
              // Fade in near emitter, fade out near receiver
              const waveAlpha = Math.sin(wPhase * Math.PI) * Math.min(0.85, (radMetrics.fluxDensityWm2 / 1200) * 0.85 + 0.15);
              const wMat = waveMesh.material as THREE.MeshBasicMaterial;
              if (wMat) {
                wMat.opacity = Math.max(0, waveAlpha);
              }
            }
          });

          if (heatGapLine) {
            heatGapLine.visible = isRadiationActive;
          }

          // Throttle React state telemetry update to avoid re-rendering every single frame
          if (Math.random() < 0.12) {
            setHeatTelemetryState({
              conductionTemps: [...currentCondState.temperatures],
              convectionMetrics: { ...convMetrics },
              radiationMetrics: { ...radMetrics },
              activeMode: mode,
              activeMaterial: matSpec.name,
              ambientTempC: Tamb,
              heatSourceTempC: Th,
            });
          }
        }

        // 46. Model 37: Four-Stroke Internal Combustion Engine
        if (modelSpec.functionalType === 'four-stroke-engine' || modelSpec.id === 'four-stroke-engine') {
          const rpm = parameters.engineSpeedRpm ?? parameters.engineRpm ?? 1000;
          const strokeMode = conditions.activeStroke || 'continuous';
          const internalOn = Boolean(conditions.internalView);
          const ignitionOn = conditions.sparkIgnition !== false;

          const block = meshMap.get('engine-cylinder-block') ?? meshMap.get('cylinder-block');
          const piston = meshMap.get('reciprocating-piston') ?? meshMap.get('piston-crown');
          const rod = meshMap.get('connecting-rod');
          const crank = meshMap.get('crankshaft-journal') ?? meshMap.get('crankshaft-web');
          const intakeV = meshMap.get('intake-valve-poppet') ?? meshMap.get('intake-valve');
          const exhaustV = meshMap.get('exhaust-valve-poppet') ?? meshMap.get('exhaust-valve');
          const chamber = meshMap.get('combustion-gas-chamber') ?? meshMap.get('combustion-chamber-glow');
          const spark = meshMap.get('spark-plug-igniter') ?? meshMap.get('spark-plug');

          if (block) {
            const bMat = (block as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (internalOn) {
              bMat.transparent = true;
              bMat.opacity = 0.25;
            } else {
              bMat.transparent = false;
              bMat.opacity = 0.8;
            }
          }

          // Kinematic stroke angle in [0, 4pi)
          let theta = 0;
          if (strokeMode === 'continuous') {
            const omega = (rpm * Math.PI * 2) / 60;
            theta = (simTime * omega) % (Math.PI * 4);
          } else if (strokeMode === 'intake') {
            theta = Math.PI * 0.5;
          } else if (strokeMode === 'compression') {
            theta = Math.PI * 1.5;
          } else if (strokeMode === 'power') {
            theta = Math.PI * 2.5;
          } else if (strokeMode === 'exhaust') {
            theta = Math.PI * 3.5;
          }

          // Piston slider-crank kinematics: r = 0.55, L = 1.6
          const r = 0.55;
          const L = 1.6;
          const yPiston = r * Math.cos(theta) + Math.sqrt(L * L - r * r * Math.sin(theta) * Math.sin(theta)) - 0.4;
          const rodAngle = Math.asin((r / L) * Math.sin(theta));

          if (crank) crank.rotation.z = -theta;
          if (piston) piston.position.y = yPiston;
          if (rod) {
            rod.position.set((r * 0.5) * Math.sin(theta), yPiston - 0.8, 0);
            rod.rotation.z = -rodAngle;
          }

          // Spark plug discharge flash at TDC between compression and power (theta ~ 2*PI)
          if (spark && (spark as THREE.Mesh).material) {
            const sMat = (spark as THREE.Mesh).material as THREE.MeshStandardMaterial;
            const isSparking = ignitionOn && theta >= Math.PI * 1.92 && theta <= Math.PI * 2.25;
            if (sMat.emissive) {
              sMat.emissive.setHex(isSparking ? 0x38bdf8 : 0x0284c7);
              sMat.emissiveIntensity = isSparking ? 1.0 : 0.15;
            }
          }

          // Valve timing & chamber thermodynamic colors
          if (theta < Math.PI) {
            // 1. INTAKE stroke
            if (intakeV) intakeV.position.y = 2.05; // Open
            if (exhaustV) exhaustV.position.y = 2.3; // Closed
            if (chamber) {
              const cMat = (chamber as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (cMat && cMat.emissive) cMat.emissive.setHex(0xe0f2fe); // Fresh atomized air-fuel vapor
            }
          } else if (theta < Math.PI * 2) {
            // 2. COMPRESSION stroke
            if (intakeV) intakeV.position.y = 2.3; // Closed
            if (exhaustV) exhaustV.position.y = 2.3; // Closed
            if (chamber) {
              const cMat = (chamber as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (cMat && cMat.emissive) cMat.emissive.setHex(0xf59e0b); // Compressed hot charge
            }
          } else if (theta < Math.PI * 3) {
            // 3. POWER stroke
            if (intakeV) intakeV.position.y = 2.3; // Closed
            if (exhaustV) exhaustV.position.y = 2.3; // Closed
            if (chamber) {
              const cMat = (chamber as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (cMat && cMat.emissive) cMat.emissive.setHex(ignitionOn ? 0xdc2626 : 0xf59e0b); // Flaming explosion
            }
          } else {
            // 4. EXHAUST stroke
            if (intakeV) intakeV.position.y = 2.3; // Closed
            if (exhaustV) exhaustV.position.y = 2.05; // Open
            if (chamber) {
              const cMat = (chamber as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (cMat && cMat.emissive) cMat.emissive.setHex(0x78716c); // Burned exhaust gas
            }
          }
        }

        // 47. Model 38: Electric Bell Mechanism
        if (modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell') {
          const v = parameters.operatingVoltage ?? 12;
          const k = parameters.springTension ?? 380;
          const targetHz = parameters.bellRingingSpeed ?? 15;
          const swClosed = conditions.powerSwitch !== false;
          const internalOn = Boolean(conditions.internalView);

          // Step electric bell simulation engine if playing
          if (isPlayingRef.current) {
            bellSimRef.current = stepElectricBell(
              bellSimRef.current,
              {
                operatingVoltage: v,
                springTension: k,
                bellRingingSpeed: targetHz,
                switchClosed: swClosed,
              },
              delta
            );
          }

          const curState = bellSimRef.current;

          // 1. Articulated Armature kinematics (pivot at bottom, top swings towards electromagnet/gong)
          if (bellArmaturePivotGroup) {
            // Negative rotation around Z swings top towards +X (towards electromagnet and gong)
            bellArmaturePivotGroup.rotation.z = -curState.armatureAngle;
          }

          // 2. Flexible Phosphor Bronze Spring Leaf deflection
          if (bellSpringMesh) {
            // Spring bends with armature deflection
            bellSpringMesh.rotation.z = -curState.armatureAngle * 0.5;
          }

          // 3. Switch Blade (closed against jaws when switch ON, swung up open when switch OFF)
          if (bellSwitchBlade) {
            bellSwitchBlade.rotation.z = curState.switchClosed ? 0.0 : 0.65;
          }

          // 4. Contact Breaker Spark
          if (bellSparkMesh) {
            const sparkMat = bellSparkMesh.material as THREE.MeshBasicMaterial;
            if (sparkMat) {
              sparkMat.opacity = curState.sparkIntensity;
            }
            bellSparkMesh.visible = curState.sparkIntensity > 0.05;
            const spkScale = 0.5 + curState.sparkIntensity * 0.8;
            bellSparkMesh.scale.set(spkScale, spkScale, spkScale);
          }

          // 5. Electromagnet Coils & Core field glow
          bellCoilWireMats.forEach((mat) => {
            if (curState.electromagnetActive) {
              mat.emissive.setHex(0xd97706);
              mat.emissiveIntensity = 0.45;
            } else {
              mat.emissive.setHex(0x78350f);
              mat.emissiveIntensity = 0.08;
            }
          });

          // 6. Magnetic Flux Lines across the air gap (visible if internalView is ON and coil is active)
          bellMagneticFluxArcs.forEach((line) => {
            line.visible = internalOn && curState.electromagnetActive;
          });

          // 7. Gong Resonant Acoustic Feedback & Ripple
          const gongObj = meshMap.get('resonant-gong-bell');
          if (gongObj) {
            const vib = curState.gongVibration;
            const gScale = 1.0 + vib * 0.025;
            gongObj.scale.set(gScale, gScale, gScale);
          }

          if (bellGongAcousticRipple) {
            const vib = curState.gongVibration;
            const rMat = bellGongAcousticRipple.material as THREE.MeshBasicMaterial;
            if (rMat) {
              rMat.opacity = vib * 0.75;
            }
            bellGongAcousticRipple.visible = vib > 0.05;
            const rScale = 1.0 + (1.0 - vib) * 0.35;
            bellGongAcousticRipple.scale.set(rScale, rScale, rScale);
          }

          // 8. Circuit Wiring Continuity Glow (glows when current > 0)
          bellWireMeshes.forEach((wMesh) => {
            const wMat = wMesh.material as THREE.MeshStandardMaterial;
            if (wMat) {
              if (curState.circuitClosed) {
                wMat.emissive.setHex(0xf59e0b);
                wMat.emissiveIntensity = 0.5;
              } else {
                wMat.emissive.setHex(0x78350f);
                wMat.emissiveIntensity = 0.05;
              }
            }
          });

          // Throttle telemetry update to UI HUD (~100ms)
          if (Math.floor(currentTime / 100) !== Math.floor((currentTime - delta * 1000) / 100)) {
            setBellTelemetryState({ ...curState });
          }
        }

        // 48. Model 39: Hydroelectric Power Station
        if (modelSpec.functionalType === 'hydroelectric-power' || modelSpec.id === 'hydroelectric-power') {
          const H = parameters.waterHeadHeightM ?? parameters.reservoirHead ?? 100;
          const Q = parameters.waterFlowRateM3s ?? parameters.waterFlowRate ?? 80;
          const gateOpen = conditions.waterGateOpen !== false && conditions.sluiceGateOpen !== false;
          const internalOn = Boolean(conditions.internalView);

          const dam = meshMap.get('dam-reservoir-wall') ?? meshMap.get('concrete-dam-wall');
          const penstock = meshMap.get('penstock-water-chute') ?? meshMap.get('penstock-pipe');
          const turbine = meshMap.get('hydro-turbine-runner') ?? meshMap.get('turbine-runner');
          const shaft = meshMap.get('turbine-drive-shaft') ?? meshMap.get('generator-shaft');
          const stator = meshMap.get('powerhouse-generator-stator') ?? meshMap.get('hydro-generator-stator');
          const transformer = meshMap.get('step-up-transformer-pylon') ?? meshMap.get('transmission-tower');

          if (dam) {
            const dMat = (dam as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (internalOn) {
              dMat.transparent = true;
              dMat.opacity = 0.3;
            } else {
              dMat.transparent = false;
              dMat.opacity = 0.8;
            }
          }

          // Turbine and shaft rotational speed proportional to sqrt(2*g*H) * Q when sluice gate is open
          const turbineSpeed = gateOpen ? Math.sqrt(H / 100) * 8.0 * (Q / 80) : 0;
          if (turbine) {
            turbine.rotation.y += delta * turbineSpeed;
          }
          if (shaft) {
            shaft.rotation.y += delta * turbineSpeed;
          }

          // Flow pulsing inside penstock
          if (penstock) {
            const pMat = (penstock as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (pMat && pMat.emissive) {
              pMat.emissiveIntensity = gateOpen ? 0.3 + Math.sin(simTime * 6.0) * 0.2 : 0.05;
            }
          }

          // Generator stator & step-up transformer electrical output indicator proportional to P = eta * rho * g * Q * H
          const powerNorm = gateOpen ? Math.min(1.0, (H / 150) * (Q / 120)) : 0;
          [stator, transformer].forEach((m) => {
            if (m && (m as THREE.Mesh).material) {
              const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat.emissive) {
                mat.emissive.setHex(0xf59e0b);
                mat.emissiveIntensity = 0.1 + powerNorm * 0.65;
              }
            }
          });
        }

        // 49. Model 40: Motor Effect and Fleming's Left-Hand Rule
        if (modelSpec.functionalType === 'motor-effect-fleming' || modelSpec.id === 'motor-effect-fleming') {
          const I = parameters.conductorCurrentA ?? parameters.currentMagnitude ?? 10;
          const B = parameters.magneticFieldTesla ?? parameters.magneticFluxDensity ?? 1.0;
          const currentDir = conditions.currentDirection || (conditions.reverseCurrent ? 'reverse' : 'forward');
          const fieldPol = conditions.fieldPolarity || (conditions.reverseMagneticField ? 'southTop' : 'northTop');

          const rod = meshMap.get('current-carrying-conductor') ?? meshMap.get('sliding-copper-rod');
          const forceArrow = meshMap.get('force-direction-arrow') ?? meshMap.get('lorentz-force-arrow');
          const currentArrow = meshMap.get('current-vector-i') ?? meshMap.get('current-direction-arrow');
          const bArrows = meshMap.get('magnetic-flux-arrows-b') ?? meshMap.get('magnetic-field-arrow');

          // Fleming's Left-Hand Rule: F = I (L x B)
          // Reversing either current I or magnetic field B reverses the Lorentz force direction
          const currentSign = currentDir === 'forward' ? 1.0 : -1.0;
          const fieldSign = fieldPol === 'southTop' ? -1.0 : 1.0;
          const dirSign = currentSign * fieldSign;
          const Fmag = I * B * 0.05;

          // Rod rolls in the true direction of Lorentz force F along the parallel rails
          if (rod) {
            const rollCycle = (simTime * 1.4 * Math.sqrt(Math.max(0.1, Fmag))) % 1.0;
            rod.position.z = dirSign * (-0.9 + rollCycle * 1.8);
          }

          if (forceArrow) {
            forceArrow.position.z = dirSign > 0 ? 0.9 : -0.9;
            forceArrow.rotation.x = dirSign > 0 ? 1.57 : -1.57;
            forceArrow.scale.set(1.0, 1.0, Math.min(2.0, Math.max(0.5, Fmag * 2.0)));
          }

          if (currentArrow) {
            currentArrow.rotation.z = currentSign > 0 ? 1.57 : -1.57;
          }

          if (bArrows) {
            bArrows.rotation.z = fieldSign > 0 ? 0 : Math.PI;
          }
        }

        // =========================================================================
        // ADVANCED PHYSICS BATCH 1 (41–47), BATCH 2 (48–54) & BATCH 3 (55–61) SIMULATIONS
        // =========================================================================
        if (isBatch1Studio && batch1Handles) {
          updateBatch1CustomAssemblies(batch1Handles, modelSpec, parameters, conditions, simTime, meshMap);
        }
        if (isBatch2Studio && batch2Handles) {
          updateBatch2CustomAssemblies(batch2Handles, modelSpec, parameters, conditions, simTime, meshMap);
        }
        if (isBatch3Studio && batch3Handles) {
          updateBatch3CustomAssemblies(batch3Handles, modelSpec, parameters, conditions, simTime, meshMap);
        }
        if (isBatch4Studio && batch4Handles) {
          updateBatch4CustomAssemblies(batch4Handles, modelSpec, parameters, conditions, simTime, meshMap);
        }
        if (isChemBatch1Studio && chemBatch1Handles) {
          updateChemistryBatch1CustomAssemblies(chemBatch1Handles, parameters, conditions, simTime);
        }
        if (isChemBatch2Studio && chemBatch2Handles) {
          updateChemistryBatch2CustomAssemblies(
            chemBatch2Handles.modelId,
            chemBatch2Handles.partMeshes,
            { ...parameters, ...conditions },
            0.016,
            simTime
          );
        }

        // 50. Standard Animations for all other AI-generated models
        const handledDomainTypes = [
          'dc-motor-assembly',
          'optical-telescope',
          'rutherford-scattering',
          'pendulum-harmonics',
          'class-1-lever',
          'respiratory-system',
          'solar-system',
          'human-heart',
          'dna-helix',
          'projectile-kinematics',
          'inclined-plane',
          'hydraulic-lift',
          'newtons-cradle',
          'reflection-refraction',
          'prism-dispersion',
          'electric-circuit',
          'friction-explorer',
          'wave-motion',
          'sound-wave',
          'magnetic-field-explorer',
          'interactive-atom',
          'bonding-explorer',
          'water-molecule-detailed',
          'carbon-dioxide-explorer',
          'heart-explorer',
          'respiratory-explorer',
          'digestive-system',
          'brain-explorer',
          'eye-vision',
          'plant-cell-explorer',
          'animal-cell-explorer',
          'plant-root-transport',
          'blood-circulation-microscope',
          'neuron-nerve-signal',
          'ac-generator',
          'electromagnetic-induction',
          'heat-transfer-explorer',
          'four-stroke-engine',
          'electric-bell',
          'hydroelectric-power',
          'motor-effect-fleming',
          'electromagnetic-wave-propagation',
          'plasma-physics-explorer',
          'particle-accelerator-explorer',
          'magnetic-levitation-explorer',
          'superconductivity-meissner-explorer',
          'black-hole-gravitational-lensing',
          'quantum-tunnelling-explorer',
          'faraday-law-induction-explorer',
          'motor-generator-energy-explorer',
          'ac-voltage-transformer-explorer',
          'wave-interference-diffraction-lab',
          'optical-interferometer-explorer',
          'fluid-dynamics-bernoulli-vortex',
          'tokamak-fusion-confinement-explorer',
          'doppler-effect-sonic-boom-explorer',
          'seismic-waves-earthquake-lab',
          'gyroscope-torque-angular-momentum-lab',
          'shm-coupled-oscillators-lab',
          'thermodynamics-carnot-heat-engine',
          'photoelectric-effect-quantum-explorer',
          'special-relativity-time-length-lab',
          'maxwell-equations-em-field-explorer',
          'ac-circuits-rlc-resonance-lab',
          'lenses-optical-instruments-lab',
          'doppler-ultrasound-flow-explorer',
          'earth-magnetic-field-magnetosphere-explorer',
          'semiconductor-pn-junction-diode-explorer',
          'radioactive-decay-halflife-radiation-lab',
          'molecular-orbital-explorer',
          'atomic-orbital-probability-explorer',
          'advanced-crystal-lattice-explorer',
          'molecular-polarity-explorer',
          'intermolecular-forces-explorer',
          'electrochemical-cell-simulator',
          'electrolysis-explorer',
        ];

        if (!handledDomainTypes.includes(modelSpec.functionalType || '')) {
          const isDoublePendulum =
            modelSpec.id.includes('double-pendulum') ||
            modelSpec.parts.some((p) => p.kinematicRole === 'pendulum-arm-1' || p.kinematicRole === 'pendulum-arm-2');
          const isAtwoodMachine =
            modelSpec.id.includes('atwood') ||
            modelSpec.parts.some((p) => p.kinematicRole === 'counterweight-left' || p.kinematicRole === 'counterweight-right');
          const isSarcomere = modelSpec.id.includes('sarcomere');

          if (isDoublePendulum) {
            const theta0Deg = Number(parameters.initialAngle ?? 65);
            const rodRatio = Number(parameters.rodRatio ?? 1.0);
            const massRatio = Number(parameters.massRatio ?? 1.0);
            const g = Number(parameters.gravity ?? 9.81);
            const theta0 = (theta0Deg * Math.PI) / 180;
            const L1 = 1.65;
            const L2 = 1.55 * Math.max(0.5, Math.min(1.6, rodRatio));
            const omega1 = Math.sqrt(g / L1);
            const omega2 = Math.sqrt((g / L2) * (1 + 0.45 * massRatio));

            const theta1 =
              theta0 * 0.68 * Math.cos(omega1 * simTime) +
              theta0 * 0.22 * Math.cos(omega2 * simTime);
            const theta2 =
              theta0 * 0.85 * Math.cos(omega1 * simTime - 0.35) -
              theta0 * 0.55 * Math.sin(omega2 * simTime * 1.28);

            const p0x = 0;
            const p0y = 2.35;
            const p1x = p0x + L1 * Math.sin(theta1);
            const p1y = p0y - L1 * Math.cos(theta1);
            const p2x = p1x + L2 * Math.sin(theta2);
            const p2y = p1y - L2 * Math.cos(theta2);

            const rod1Mesh = meshMap.get('rod-1');
            if (rod1Mesh) {
              rod1Mesh.position.set((p0x + p1x) / 2, (p0y + p1y) / 2, 0.35);
              rod1Mesh.rotation.set(0, 0, theta1);
            }
            const mass1Mesh = meshMap.get('mass-1');
            if (mass1Mesh) {
              mass1Mesh.position.set(p1x, p1y, 0.35);
            }
            const pivot2Mesh = meshMap.get('pivot-2');
            if (pivot2Mesh) {
              pivot2Mesh.position.set(p1x, p1y, 0.46);
            }
            const rod2Mesh = meshMap.get('rod-2');
            if (rod2Mesh) {
              rod2Mesh.position.set((p1x + p2x) / 2, (p1y + p2y) / 2, 0.46);
              rod2Mesh.rotation.set(0, 0, theta2);
              rod2Mesh.scale.set(1, L2 / 1.55, 1);
            }
            const mass2Mesh = meshMap.get('mass-2');
            if (mass2Mesh) {
              const m2Scale = Math.max(0.7, Math.min(1.45, Math.cbrt(massRatio)));
              mass2Mesh.position.set(p2x, p2y, 0.46);
              mass2Mesh.scale.set(m2Scale, m2Scale, m2Scale);
            }
            const trailMesh = meshMap.get('chaos-trail');
            if (trailMesh) {
              trailMesh.visible = Boolean(conditions.showVectors ?? true);
              trailMesh.rotation.z = Math.sin(simTime * 0.9) * 0.25;
            }
          } else if (isAtwoodMachine) {
            const m1 = Number(parameters.mass1 ?? 4.0);
            const m2 = Number(parameters.mass2 ?? 2.5);
            const g = Number(parameters.gravity ?? 9.81);
            const netAccel = ((m1 - m2) / Math.max(0.5, m1 + m2)) * (g / 9.81);
            const dy = Math.sin(simTime * 1.8) * Math.min(1.15, Math.max(0.12, Math.abs(netAccel) * 2.2)) * (netAccel >= 0 ? 1 : -1);

            const m1Mesh = meshMap.get('mass-m1');
            if (m1Mesh) {
              const s1 = Math.max(0.75, Math.min(1.4, Math.cbrt(m1 / 4.0)));
              m1Mesh.position.set(-0.85, -0.45 - dy, 0.35);
              m1Mesh.scale.set(s1, s1, s1);
            }
            const m2Mesh = meshMap.get('mass-m2');
            if (m2Mesh) {
              const s2 = Math.max(0.75, Math.min(1.4, Math.cbrt(m2 / 2.5)));
              m2Mesh.position.set(0.85, 0.25 + dy, 0.35);
              m2Mesh.scale.set(s2, s2, s2);
            }
            const pulleyMesh = meshMap.get('pulley-wheel');
            if (pulleyMesh) {
              pulleyMesh.rotation.y = dy / 0.85;
            }
          } else if (isSarcomere) {
            const ca = Number(parameters.caConcentration ?? 5.0);
            const atp = Number(parameters.atpLevel ?? 5.0);
            const slideOffset = (0.5 + 0.5 * Math.sin(simTime * 2.0 * (atp / 5.0))) * 0.65 * (ca / 10.0);
            const zLeft = meshMap.get('z-disc-left');
            if (zLeft) zLeft.position.x = -3.2 + slideOffset;
            const zRight = meshMap.get('z-disc-right');
            if (zRight) zRight.position.x = 3.2 - slideOffset;
            const actinLeft = meshMap.get('actin-left');
            if (actinLeft) actinLeft.position.x = -1.9 + slideOffset;
            const actinRight = meshMap.get('actin-right');
            if (actinRight) actinRight.position.x = 1.9 - slideOffset;
            const heads = meshMap.get('myosin-heads');
            if (heads) heads.rotation.z = Math.sin(simTime * 4.5 * (atp / 5.0)) * 0.22 * (ca / 10.0);
          } else if (modelSpec.id.includes('hydraulic-press')) {
            const F1 = Number(parameters.inputForceN ?? 200);
            const areaRatio = Math.max(2, Number(parameters.areaRatio ?? 10));
            const strokePct = Number(parameters.plungerStrokePct ?? 50) / 100;
            const cycleStroke = 0.5 + 0.5 * Math.sin(simTime * (1.2 + F1 / 250));
            const activeStroke = 0.4 * strokePct + 0.6 * cycleStroke;
            const d1 = activeStroke * 0.65; // Downward plunger travel
            const d2 = d1 / Math.sqrt(areaRatio) * 1.15; // Upward slave ram travel (scaled for visibility)

            const plunger = meshMap.get('input-plunger-piston');
            if (plunger) plunger.position.y = 0.25 - d1;
            const lever = meshMap.get('actuating-pump-lever');
            if (lever) {
              lever.position.y = 1.15 - d1;
              lever.rotation.z = 1.18 + d1 * 0.35;
            }
            const ram = meshMap.get('output-hydraulic-ram');
            const radiusScale = Math.max(0.8, Math.min(1.35, Math.sqrt(areaRatio / 10)));
            if (ram) {
              ram.position.y = -0.25 + d2;
              ram.scale.set(radiusScale, 1, radiusScale);
            }
            const slaveCyl = meshMap.get('output-slave-cylinder');
            if (slaveCyl) {
              slaveCyl.scale.set(radiusScale, 1, radiusScale);
            }
            const billet = meshMap.get('workpiece-compression-billet');
            if (billet) {
              const compressY = Math.max(0.55, 1.0 - d2 * 0.65);
              const bulgeXZ = 1.0 / Math.sqrt(compressY);
              billet.position.y = 0.85 + d2 * 0.5;
              billet.scale.set(bulgeXZ, compressY, bulgeXZ);
            }
          } else if (modelSpec.id.includes('robotic-arm')) {
            const azimDeg = Number(parameters.baseAzimuthDeg ?? 0);
            const shDeg = Number(parameters.shoulderPitchDeg ?? 18);
            const elDeg = Number(parameters.elbowPitchDeg ?? 25);
            const gripMm = Number(parameters.gripperApertureMm ?? 45);
            const cyclic = Boolean(conditions.internalView ?? true);

            const dynAzim = cyclic ? Math.sin(simTime * 0.9) * 18 : 0;
            const dynSh = cyclic ? Math.sin(simTime * 1.35) * 14 : 0;
            const dynEl = cyclic ? Math.cos(simTime * 1.35) * 18 : 0;

            const theta1 = ((azimDeg + dynAzim) * Math.PI) / 180;
            const theta2 = ((shDeg + dynSh) * Math.PI) / 180;
            const theta3 = ((elDeg + dynEl) * Math.PI) / 180;

            // Base origin at (-0.8, -1.0, 0)
            const ox = -0.8;
            const oy = -1.0;
            const L1 = 1.85;
            const L2 = 1.6;

            const turret = meshMap.get('waist-azimuth-turret-j1');
            if (turret) turret.rotation.y = theta1;

            const shJoint = meshMap.get('shoulder-servo-joint-j2');
            if (shJoint) shJoint.rotation.y = theta1;

            // Elbow position in 3D from shoulder pitch theta2 and waist yaw theta1
            const r1 = L1 * Math.sin(theta2);
            const y1 = oy + L1 * Math.cos(theta2);
            const x1 = ox + r1 * Math.cos(theta1);
            const z1 = -r1 * Math.sin(theta1);

            const link1 = meshMap.get('lower-humeral-link-l1');
            if (link1) {
              link1.position.set((ox + x1) / 2, (oy + y1) / 2, z1 / 2);
              link1.rotation.set(0, theta1, -theta2);
            }

            const elJoint = meshMap.get('elbow-servo-joint-j3');
            if (elJoint) {
              elJoint.position.set(x1, y1, z1);
              elJoint.rotation.set(Math.PI / 2, theta1, 0);
            }

            // Wrist position in 3D from cumulative pitch (theta2 + theta3 + 50 deg nominal forearm bend)
            const totalPitch = theta2 + theta3 + 0.85;
            const r2 = r1 + L2 * Math.sin(totalPitch);
            const y2 = y1 + L2 * Math.cos(totalPitch);
            const x2 = ox + r2 * Math.cos(theta1);
            const z2 = -r2 * Math.sin(theta1);

            const link2 = meshMap.get('upper-forearm-link-l2');
            if (link2) {
              link2.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
              link2.rotation.set(0, theta1, -totalPitch);
            }

            const wrist = meshMap.get('wrist-roll-pitch-unit-j4');
            if (wrist) {
              wrist.position.set(x2, y2, z2);
            }

            const halfGap = Math.max(0.08, (gripMm / 1000) * 4.5);
            const jawL = meshMap.get('gripper-finger-left');
            if (jawL) {
              jawL.position.set(
                x2 + 0.22 * Math.cos(theta1) - halfGap * Math.sin(theta1),
                y2 - 0.28,
                z2 - 0.22 * Math.sin(theta1) + halfGap * Math.cos(theta1)
              );
              jawL.rotation.y = theta1;
            }
            const jawR = meshMap.get('gripper-finger-right');
            if (jawR) {
              jawR.position.set(
                x2 + 0.22 * Math.cos(theta1) + halfGap * Math.sin(theta1),
                y2 - 0.28,
                z2 - 0.22 * Math.sin(theta1) - halfGap * Math.cos(theta1)
              );
              jawR.rotation.y = theta1;
            }
          } else {
            modelSpec.parts.forEach((part, partIdx) => {
              const mesh = meshMap.get(part.id);
              if (!mesh) return;

              let speedMultiplier = 1.0;
              let scaleMult = 1.0;
              let posOffset = 0;
              let rotOffset = 0;

              if (modelSpec.parameters) {
                Object.values(modelSpec.parameters).forEach((param) => {
                  const isTargeted = !param.targetPartId || param.targetPartId === part.id;
                  const val = Number(parameters[param.id] ?? param.defaultValue ?? 1);
                  const defVal = Number(param.defaultValue || 1) || 1;
                  if (param.affects === 'animationSpeed' && isTargeted) {
                    speedMultiplier = defVal > 0 ? (val / defVal) * (param.scaleFactor ?? 1) : val * (param.scaleFactor ?? 0.5);
                  } else if (param.affects === 'objectScale' && isTargeted) {
                    scaleMult = defVal > 0 ? val / defVal : val;
                  } else if (param.affects === 'objectPosition' && isTargeted) {
                    posOffset = (val - defVal) * (param.scaleFactor ?? 0.35);
                  } else if (param.affects === 'objectRotation' && isTargeted) {
                    rotOffset = ((val - defVal) * Math.PI) / 180;
                  }
                });
              }

              // Internal cutaway support for outer shells/membranes/envelopes
              if (conditions.internalView !== undefined && (mesh as THREE.Mesh).material) {
                const isOuterShell =
                  (part.opacity !== undefined && part.opacity < 0.85) ||
                  /membrane|envelope|wall|shell|capsule|cortex|casing|glass|chamber/i.test(`${part.id} ${part.name}`);
                if (isOuterShell) {
                  const mat = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
                  mat.transparent = true;
                  mat.opacity = conditions.internalView
                    ? Math.min(part.opacity ?? 0.6, 0.25)
                    : (part.opacity ?? 0.85);
                }
              }

              const baseScale = part.scale || [1, 1, 1];
              const basePos = part.position || [0, 0, 0];
              const baseRot = part.rotation || [0, 0, 0];

              if (!part.animation) {
                mesh.scale.set(baseScale[0] * scaleMult, baseScale[1] * scaleMult, baseScale[2] * scaleMult);
                mesh.position.set(basePos[0] + posOffset, basePos[1], basePos[2]);
                if (rotOffset !== 0) {
                  mesh.rotation.set(baseRot[0], baseRot[1] + rotOffset, baseRot[2]);
                }
                return;
              }

              const speed = (part.animation.speed || 1.2) * Math.max(0.05, speedMultiplier);
              const axis = part.animation.axis || 'y';

              if (part.animation.type === 'spin') {
                mesh.rotation[axis] += delta * speed;
                mesh.scale.set(baseScale[0] * scaleMult, baseScale[1] * scaleMult, baseScale[2] * scaleMult);
              } else if (part.animation.type === 'oscillate') {
                const amp = (part.animation.amplitude || 0.2) * Math.max(0.4, scaleMult);
                const phase = partIdx * 0.65;
                const wave = Math.sin(simTime * speed * 2.2 + phase) * amp;
                if (axis === 'x') {
                  mesh.position.x = basePos[0] + posOffset + wave;
                } else if (axis === 'y') {
                  mesh.position.y = basePos[1] + wave;
                } else {
                  mesh.position.z = basePos[2] + wave;
                }
                mesh.rotation[axis] = (baseRot[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] || 0) + wave * 0.45 + rotOffset;
                mesh.scale.set(baseScale[0] * scaleMult, baseScale[1] * scaleMult, baseScale[2] * scaleMult);
              } else if (part.animation.type === 'pulse') {
                const amp = part.animation.amplitude || 0.12;
                const phase = partIdx * 0.5;
                const s = (1.0 + Math.sin(simTime * speed * 2.4 + phase) * amp) * scaleMult;
                mesh.scale.set(baseScale[0] * s, baseScale[1] * s, baseScale[2] * s);
                mesh.position.set(basePos[0] + posOffset, basePos[1], basePos[2]);
              } else if (part.animation.type === 'orbit') {
                const r = Math.max(0.4, Math.hypot(basePos[0], basePos[2])) * scaleMult;
                const initialAngle = Math.atan2(basePos[2], basePos[0]);
                const angle = initialAngle + simTime * speed * 0.85;
                mesh.position.x = r * Math.cos(angle) + posOffset;
                mesh.position.z = r * Math.sin(angle);
                mesh.position.y = basePos[1] + Math.sin(simTime * speed * 1.5 + partIdx) * (part.animation.amplitude || 0.08);
              }
            });
          }
        }
      } else if (isBatch1Studio && batch1Handles) {
        // Keep slider/condition-driven geometry responsive even while paused
        updateBatch1CustomAssemblies(batch1Handles, modelSpec, parameters, conditions, simTime, meshMap);
      } else if (isBatch2Studio && batch2Handles) {
        updateBatch2CustomAssemblies(batch2Handles, modelSpec, parameters, conditions, simTime, meshMap);
      } else if (isBatch3Studio && batch3Handles) {
        updateBatch3CustomAssemblies(batch3Handles, modelSpec, parameters, conditions, simTime, meshMap);
      } else if (isBatch4Studio && batch4Handles) {
        updateBatch4CustomAssemblies(batch4Handles, modelSpec, parameters, conditions, simTime, meshMap);
      } else if (isChemBatch1Studio && chemBatch1Handles) {
        updateChemistryBatch1CustomAssemblies(chemBatch1Handles, parameters, conditions, simTime);
      } else {
        // Apply static parameter adjustments (including connected Double Pendulum / Atwood / Sarcomere geometry) when simulation is paused
        const isDoublePendulum =
          modelSpec.id.includes('double-pendulum') ||
          modelSpec.parts.some((p) => p.kinematicRole === 'pendulum-arm-1' || p.kinematicRole === 'pendulum-arm-2');
        if (isDoublePendulum) {
          const theta0Deg = Number(parameters.initialAngle ?? 65);
          const rodRatio = Number(parameters.rodRatio ?? 1.0);
          const massRatio = Number(parameters.massRatio ?? 1.0);
          const theta1 = ((theta0Deg * 0.65) * Math.PI) / 180;
          const theta2 = ((theta0Deg * 0.85) * Math.PI) / 180;
          const L1 = 1.65;
          const L2 = 1.55 * Math.max(0.5, Math.min(1.6, rodRatio));
          const p0x = 0;
          const p0y = 2.35;
          const p1x = p0x + L1 * Math.sin(theta1);
          const p1y = p0y - L1 * Math.cos(theta1);
          const p2x = p1x + L2 * Math.sin(theta2);
          const p2y = p1y - L2 * Math.cos(theta2);

          const rod1Mesh = meshMap.get('rod-1');
          if (rod1Mesh) {
            rod1Mesh.position.set((p0x + p1x) / 2, (p0y + p1y) / 2, 0.35);
            rod1Mesh.rotation.set(0, 0, theta1);
          }
          const mass1Mesh = meshMap.get('mass-1');
          if (mass1Mesh) mass1Mesh.position.set(p1x, p1y, 0.35);
          const pivot2Mesh = meshMap.get('pivot-2');
          if (pivot2Mesh) pivot2Mesh.position.set(p1x, p1y, 0.46);
          const rod2Mesh = meshMap.get('rod-2');
          if (rod2Mesh) {
            rod2Mesh.position.set((p1x + p2x) / 2, (p1y + p2y) / 2, 0.46);
            rod2Mesh.rotation.set(0, 0, theta2);
            rod2Mesh.scale.set(1, L2 / 1.55, 1);
          }
          const mass2Mesh = meshMap.get('mass-2');
          if (mass2Mesh) {
            const m2Scale = Math.max(0.7, Math.min(1.45, Math.cbrt(massRatio)));
            mass2Mesh.position.set(p2x, p2y, 0.46);
            mass2Mesh.scale.set(m2Scale, m2Scale, m2Scale);
          }
        } else {
          modelSpec.parts.forEach((part) => {
            const mesh = meshMap.get(part.id);
            if (!mesh) return;
            let scaleMult = 1.0;
            let posOffset = 0;
            if (modelSpec.parameters) {
              Object.values(modelSpec.parameters).forEach((param) => {
                const isTargeted = !param.targetPartId || param.targetPartId === part.id;
                const val = Number(parameters[param.id] ?? param.defaultValue ?? 1);
                const defVal = Number(param.defaultValue || 1) || 1;
                if (param.affects === 'objectScale' && isTargeted) {
                  scaleMult = defVal > 0 ? val / defVal : val;
                } else if (param.affects === 'objectPosition' && isTargeted) {
                  posOffset = (val - defVal) * (param.scaleFactor ?? 0.35);
                }
              });
            }
            const baseScale = part.scale || [1, 1, 1];
            const basePos = part.position || [0, 0, 0];
            mesh.scale.set(baseScale[0] * scaleMult, baseScale[1] * scaleMult, baseScale[2] * scaleMult);
            if (!part.animation || part.animation.type !== 'orbit') {
              mesh.position.x = basePos[0] + posOffset;
            }
          });
        }
      }

      // Preserve active blue component highlight across dynamic material updates
      if (inspectedPartRef.current) {
        applyPartBlueHighlightToMap(meshMap, inspectedPartRef.current.id);
      }

      // 2D Projected Screen Labels (External Scientific Callouts)
      if (showLabels && container) {
        const tempV = new THREE.Vector3();
        const bbox = new THREE.Box3();
        const rect = container.getBoundingClientRect();

        const projected: ExternalCalloutItem[] = modelSpec.parts
          .filter((p) => Boolean(getComponentDisplayName(p)))
          .map((p) => {
            const mesh = meshMap.get(p.id);
            if (!mesh || !mesh.visible) return null;

            // Calculate precise 3D centroid or part anchor
            if (isBatch1Studio || isBatch2Studio || isBatch3Studio || isBatch4Studio) {
              mesh.getWorldPosition(tempV);
            } else {
              bbox.setFromObject(mesh);
              if (!bbox.isEmpty()) {
                bbox.getCenter(tempV);
              } else {
                mesh.getWorldPosition(tempV);
              }
            }

            tempV.project(camera);

            const isVisible = tempV.z < 1;
            const x = (tempV.x * 0.5 + 0.5) * rect.width;
            const y = (-(tempV.y * 0.5) + 0.5) * rect.height;

            const dynamicLabel = getComponentDisplayName(p);

            return {
              id: p.id,
              name: getComponentDisplayName(p),
              label: dynamicLabel,
              color: p.labelColor,
              anchorX: x,
              anchorY: y,
              depth: tempV.z,
              visible: isVisible,
              isSelected: inspectedPart?.id === p.id,
            };
          })
          .filter(Boolean) as ExternalCalloutItem[];

        setScreenLabels(projected);
      } else {
        setScreenLabels([]);
      }

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const updateContainerDimensions = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      setContainerDimensions({ width: w, height: h });
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    updateContainerDimensions();

    const handleResize = () => {
      updateContainerDimensions();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      if (disposeBatch1StudioEnv) disposeBatch1StudioEnv();
      if (disposePreBatch1StudioEnv) disposePreBatch1StudioEnv();
      scene.traverse((obj: any) => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => {
              if (m?.map && typeof m.map.dispose === 'function') m.map.dispose();
              if (typeof m?.dispose === 'function') m.dispose();
            });
          } else {
            if (obj.material.map && typeof obj.material.map.dispose === 'function') obj.material.map.dispose();
            if (typeof obj.material.dispose === 'function') obj.material.dispose();
          }
        }
      });
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelSpec.id]);

  const hasInternalViewCondition = Boolean(
    (modelSpec.conditions && Object.values(modelSpec.conditions).some((c) => c.id === 'internalView')) ||
    conditions.internalView !== undefined ||
    conditions.viewMode === 'cutaway' ||
    conditions.inspectionView === 'internalCutaway'
  );
  const isInternalViewActive = Boolean(
    conditions.internalView ||
    conditions.viewMode === 'cutaway' ||
    conditions.inspectionView === 'internalCutaway'
  );
  const handleToggleInternalView = (val: boolean) => {
    if (conditions.viewMode !== undefined) {
      const mode = val ? 'cutaway' : 'whole';
      if (onUpdateCondition) onUpdateCondition('viewMode', mode);
      else setInternalConditions((prev) => ({ ...prev, viewMode: mode }));
    } else if (conditions.inspectionView !== undefined) {
      const mode = val ? 'internalCutaway' : 'external';
      if (onUpdateCondition) onUpdateCondition('inspectionView', mode);
      else setInternalConditions((prev) => ({ ...prev, inspectionView: mode }));
    } else {
      if (onUpdateCondition) onUpdateCondition('internalView', val);
      else setInternalConditions((prev) => ({ ...prev, internalView: val }));
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Generate presentation export data for this scientific 3D model
  const presentationData: PresentationExportOptions = useMemo(() => {
    return {
      title: modelSpec.title,
      subtitle: `${modelSpec.concept} • Tech-Anatomix STEM Laboratory`,
      category: 'model',
      concept: modelSpec.concept,
      slides: [
        {
          title: 'Scientific Concept & Overview',
          subtitle: modelSpec.concept,
          bullets: [
            modelSpec.whatIsIt || modelSpec.description,
            modelSpec.howDoesItWork || 'Physical interaction under scientific laws and mechanics',
            `Simulation Engine: ${modelSpec.simulationModel === 'illustrative' ? 'Illustrative Scientific Visualization' : 'Predictive Physical Model'}`,
          ],
          callout: modelSpec.equations?.[0] ? `Governing Formula: ${modelSpec.equations[0]}` : undefined,
        },
        {
          title: 'Modular Subassemblies & Components',
          subtitle: `${modelSpec.parts.length} Distinct Physical Parts`,
          details: modelSpec.parts.slice(0, 6).map((p) => ({
            label: getComponentDisplayName(p),
            text: p.whatDoesItDo || p.description || p.whatIsIt || 'Essential operational component in assembly',
          })),
        },
        {
          title: 'Simulation Parameters & Limits',
          subtitle: 'Real-Time Dynamic Experiment Variables',
          table: {
            headers: ['Parameter', 'Default', 'Min', 'Max', 'Unit'],
            rows: Object.values(modelSpec.parameters).slice(0, 6).map((param) => [
              param.name,
              String(param.defaultValue),
              String(param.min),
              String(param.max),
              param.unit || 'a.u.',
            ]),
          },
        },
        {
          title: 'Educational Connections & Real-World Context',
          subtitle: 'Classroom & Engineering Relevance',
          bullets: [
            `Real-World Engineering: ${modelSpec.realLifeExample || 'Applied extensively in industrial and laboratory apparatus'}`,
            `Exam Connection: ${modelSpec.examConnection || 'Core principle covered in standard physics and STEM curricula'}`,
          ],
        },
      ],
    };
  }, [modelSpec]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* =========================================================================
          PHASE 6: TWO-COLUMN RESPONSIVE WORKSPACE FOR LAPTOP & DESKTOP
          Left Column (50%): Compact 3D Model Viewer + Educational Explanation Box
          Right Column (50%): Model-specific Controls, Parameters, Subassemblies & Presets
          ========================================================================= */}
      {isHeartModel ? (
        <ExternalModelWorkspace
          modelId={modelSpec.id || 'heart-explorer'}
          title={modelSpec.title || 'Labelled 3D Animated Realistic Heart'}
          badge="Interactive 3D Anatomical Model"
          subtitle={modelSpec.concept || 'Cardiovascular Hemodynamics, 4 Chambers & Valvular Mechanics'}
          concept={modelSpec.concept}
          description={modelSpec.description}
          parts={modelSpec.parts}
          equations={modelSpec.equations}
          examConnection={modelSpec.examConnection}
          whatIsIt={modelSpec.whatIsIt}
          howDoesItWork={modelSpec.howDoesItWork}
          realLifeExample={
            modelSpec.realLifeExample ||
            'Pumping blood continuously at 72 BPM, circulating 5 liters of blood per minute.'
          }
          whyTitle="3D ANATOMICAL HEART REVIEW"
          whyExplanation="Explore the human heart in high-fidelity realistic 3D with anatomical labels, interactive orbit, zoom, pan, and real-time cardiac pumping animation."
          embedUrl="https://sketchfab.com/models/cc339417fcd745afafaa01623405b69a/embed?autostart=1"
          embedTitle="Labelled 3d Animated Realistic Heart"
          authorName="Anatomy by Doctor Jana"
          authorUrl="https://sketchfab.com/docjana"
          modelUrl="https://sketchfab.com/3d-models/labelled-3d-animated-realistic-heart-cc339417fcd745afafaa01623405b69a"
          onExportPresentation={() => setIsExportModalOpen(true)}
        />
      ) : isRespiratoryModel ? (
        <ExternalModelWorkspace
          modelId={modelSpec.id || 'respiratory-explorer'}
          title={modelSpec.title || 'Human Respiratory System'}
          badge="Interactive 3D Anatomical Model"
          subtitle={modelSpec.concept || 'Pulmonary Ventilation, Bronchial Arborization & Alveolar Gas Exchange'}
          concept={modelSpec.concept}
          description={modelSpec.description}
          parts={modelSpec.parts}
          equations={modelSpec.equations}
          examConnection={modelSpec.examConnection}
          whatIsIt={modelSpec.whatIsIt}
          howDoesItWork={modelSpec.howDoesItWork}
          realLifeExample={
            modelSpec.realLifeExample ||
            'Taking a deep breath during exercise or panting after running.'
          }
          whyTitle="3D ANATOMICAL MODEL REVIEW"
          whyExplanation="Explore the human respiratory tract in high-fidelity 3D with interactive orbit, zoom, pan, and real-time anatomical annotations directly on the model."
          embedUrl="https://sketchfab.com/models/250911151757489da1cf5501b791f363/embed?autostart=1&camera=0&annotations_visible=1"
          embedTitle="Human Respiratory system review"
          authorName="Darmawan Pujisetyadi"
          authorUrl="https://sketchfab.com/shinjou"
          modelUrl="https://sketchfab.com/3d-models/human-respiratory-system-review-250911151757489da1cf5501b791f363"
          onExportPresentation={() => setIsExportModalOpen(true)}
        />
      ) : isDigestiveModel ? (
        <ExternalModelWorkspace
          modelId={modelSpec.id || 'digestive-system'}
          title={modelSpec.title || 'Human Digestive System (detachable organ)'}
          badge="Interactive 3D Anatomical Model"
          subtitle={modelSpec.concept || 'Gastrointestinal Motility, Alimentary Canal & Detachable Organs'}
          concept={modelSpec.concept}
          description={modelSpec.description}
          parts={modelSpec.parts}
          equations={modelSpec.equations}
          examConnection={modelSpec.examConnection}
          whatIsIt={modelSpec.whatIsIt}
          howDoesItWork={modelSpec.howDoesItWork}
          realLifeExample={
            modelSpec.realLifeExample ||
            'Converting a morning meal into circulating glucose, amino acids, and cellular energy over a 24-hour journey.'
          }
          whyTitle="3D ANATOMICAL DIGESTIVE REVIEW"
          whyExplanation="Explore the human alimentary canal and detachable gastrointestinal organs in high-fidelity 3D with interactive orbit, zoom, pan, and real-time anatomical annotations directly on the model."
          embedUrl="https://sketchfab.com/models/053bab50888840afbbe24c361887c8f9/embed?autostart=1&camera=0&annotations_visible=1&annotation=1&transparent=1"
          embedTitle="Human Digestive System (detachable organ)"
          authorName="Wandi Amin"
          authorUrl="https://sketchfab.com/eyemo80"
          modelUrl="https://sketchfab.com/3d-models/human-digestive-system-detachable-organ-053bab50888840afbbe24c361887c8f9"
          onExportPresentation={() => setIsExportModalOpen(true)}
        />
      ) : isBrainModel ? (
        <ExternalModelWorkspace
          modelId={modelSpec.id || 'brain-explorer'}
          title={modelSpec.title || 'Whole brain with gross anatomy annotations'}
          badge="Interactive 3D Anatomical Model"
          subtitle={modelSpec.concept || 'Cerebral Hemispheres, Cortical Lobes, Cerebellum & Brainstem Neuroanatomy'}
          concept={modelSpec.concept}
          description={modelSpec.description}
          parts={modelSpec.parts}
          equations={modelSpec.equations}
          examConnection={modelSpec.examConnection}
          whatIsIt={modelSpec.whatIsIt}
          howDoesItWork={modelSpec.howDoesItWork}
          realLifeExample={
            modelSpec.realLifeExample ||
            'Coordinating voluntary movement, sensory processing, memory encoding, and executive decision-making.'
          }
          whyTitle="3D ANATOMICAL BRAIN REVIEW"
          whyExplanation="Explore the complete human brain in high-fidelity 3D with interactive orbit, zoom, pan, and real-time anatomical annotations directly on the model."
          embedUrl="https://sketchfab.com/models/f390b7e894d2446789e5a0b89d4abe8d/embed?autostart=1&camera=0&annotations_visible=1&annotation=1"
          embedTitle="Whole brain with gross anatomy annotations"
          authorName="TavorLab"
          authorUrl="https://sketchfab.com/IT_Lab"
          modelUrl="https://sketchfab.com/3d-models/whole-brain-with-gross-anatomy-annotations-f390b7e894d2446789e5a0b89d4abe8d"
          onExportPresentation={() => setIsExportModalOpen(true)}
        />
      ) : modelSpec.embedHtml ? (
        <ExternalModelWorkspace
          modelId={modelSpec.id}
          title={modelSpec.title}
          badge="External 3D Model"
          subtitle={modelSpec.concept}
          concept={modelSpec.concept}
          description={modelSpec.description}
          parts={modelSpec.parts}
          equations={modelSpec.equations}
          examConnection={modelSpec.examConnection}
          whatIsIt={modelSpec.whatIsIt}
          howDoesItWork={modelSpec.howDoesItWork}
          realLifeExample={modelSpec.realLifeExample}
          embedUrl={(modelSpec.embedHtml.match(/src="([^"]+)"/) || [])[1] || ''}
          embedTitle={modelSpec.title}
          rawEmbedHtml={modelSpec.embedHtml}
          onExportPresentation={() => setIsExportModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* LEFT COLUMN: COMPACT 3D MODEL VIEWER + EXPLANATION */}
          <div className="lg:col-span-6 flex flex-col gap-4 w-full">
            {/* Scale Note Notification Banner (Rendered OUTSIDE 3D viewport) */}
            {modelSpec.scaleNote &&
              modelSpec.id !== 'blood-transport' &&
              modelSpec.functionalType !== 'blood-transport' && (
              <div className="p-3 rounded-xl border border-amber-200/90 bg-amber-50/90 text-xs text-amber-950 flex items-start gap-2 shadow-xs">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                    Model Scale & Precision Notice
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">{modelSpec.scaleNote}</p>
                </div>
              </div>
            )}

            <Global3DViewer
              title={modelSpec.title}
              subtitle={modelSpec.concept}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onResetSimulation={handleFullViewerReset}
              onResetCamera={handleResetCameraOnly}
              showPlayControl={true}
              showLabels={showLabels}
              onToggleLabels={setShowLabels}
              showGrid={showGrid}
              onToggleGrid={setShowGrid}
              showAxes={showAxes}
              onToggleAxes={setShowAxes}
              isExplorePartsActive={isExplorePartsActive}
              onToggleExploreParts={setIsExplorePartsActive}
              isExplodedView={isExplodedView}
              onToggleExplodedView={setIsExplodedView}
              isInternalView={hasInternalViewCondition ? isInternalViewActive : undefined}
              onToggleInternalView={hasInternalViewCondition ? handleToggleInternalView : undefined}
              onFitToModel={handleResetCameraOnly}
              activeInspectedPartName={inspectedPart ? getComponentDisplayName(inspectedPart) : null}
              onBackToFullModel={handleResetCameraOnly}
              onTryIt={onTryIt}
              tryItLabel="TRY IT"
              heightClass="h-[440px] sm:h-[480px] lg:h-[520px]"
              modelPosition={modelPosition}
              onModelPositionChange={setModelPosition}
              onResetModelPosition={() => setModelPosition({ x: 0, y: 0 })}
              positionRange={positionRange}
              enablePositionControls={true}
              telemetry={
                modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell'
                  ? [
                      { label: 'Step', value: `${bellTelemetryState?.currentStep || 1}/9` },
                      { label: 'Circuit', value: bellTelemetryState?.circuitClosed ? 'Closed' : 'Open' },
                      { label: 'Current', value: `${(bellTelemetryState?.circuitCurrent ?? 0).toFixed(1)} A` },
                      { label: 'Rings', value: `${bellTelemetryState?.strikeCount || 0}` },
                    ]
                  : modelSpec.functionalType === 'bonding-explorer'
                  ? [
                      {
                        label: 'Type',
                        value:
                          conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                            ? 'Covalent'
                            : 'Ionic',
                      },
                      {
                        label: 'Valence e⁻',
                        value: conditions.example === 'hydrogen_gas' ? '2 e⁻' : '8 e⁻',
                      },
                      { label: 'Conserved', value: '100%' },
                    ]
                  : modelSpec.functionalType === 'electromagnetic-wave-propagation'
                  ? (() => {
                      const m = calculateEmWaveMetrics({
                        amplitude: parameters.amplitude,
                        wavelength: parameters.wavelength,
                        frequency: parameters.frequency,
                      });
                      return [
                        { label: 'f = c/λ', value: `${m.frequencyMhz} MHz` },
                        { label: 'B₀ = E₀/c', value: `${m.magneticAmplitudeNt} nT` },
                        { label: 'Intensity', value: `${m.poyntingIntensityWm2} W/m²` },
                      ];
                    })()
                  : modelSpec.functionalType === 'plasma-physics-explorer'
                  ? (() => {
                      const m = calculatePlasmaMetrics({
                        plasmaTemperature: parameters.plasmaTemperature,
                        particleDensity: parameters.particleDensity,
                        magneticFieldB: parameters.magneticFieldB,
                        electricFieldE: parameters.electricFieldE,
                      });
                      return [
                        { label: 'Debye λ_D', value: `${m.debyeLengthUm} μm` },
                        { label: 'f_pe', value: `${m.plasmaFrequencyGhz} GHz` },
                        { label: 'Ion r_L', value: `${m.ionLarmorRadiusMm} mm` },
                      ];
                    })()
                  : modelSpec.functionalType === 'particle-accelerator-explorer'
                  ? (() => {
                      const m = calculateAcceleratorMetrics({
                        acceleratingVoltageKv: parameters.acceleratingVoltageKv,
                        dipoleFieldTesla: parameters.dipoleFieldTesla,
                        particleMassAmu: parameters.particleMassAmu,
                      });
                      return [
                        { label: 'ΔK = qV', value: `${m.kineticEnergyKev} keV` },
                        { label: 'Radius R', value: `${m.bendingRadiusM} m` },
                        { label: 'W_B', value: '0 J (F_B⊥v)' },
                      ];
                    })()
                  : modelSpec.functionalType === 'magnetic-levitation-explorer'
                  ? (() => {
                      const m = calculateMaglevMetrics({
                        magnetCurrentKa: parameters.magnetCurrentKa,
                        payloadMassKg: parameters.payloadMassKg,
                        dampingGain: parameters.dampingGain,
                      });
                      return [
                        { label: 'Gap z_eq', value: `${m.equilibriumGapMm} mm` },
                        { label: 'F_mag = mg', value: `${m.magneticLiftForceN} N` },
                        { label: 'Stiffness', value: `${m.verticalStiffnessKnM} kN/m` },
                      ];
                    })()
                  : modelSpec.functionalType === 'superconductivity-meissner-explorer'
                  ? (() => {
                      const m = calculateSuperconductorMetrics({
                        specimenTemperatureK: parameters.specimenTemperatureK,
                        criticalTempK: parameters.criticalTempK,
                        appliedFieldMt: parameters.appliedFieldMt,
                      });
                      return [
                        { label: 'State', value: m.isSuperconducting ? 'Meissner (T<Tc)' : 'Normal (T≥Tc)' },
                        { label: 'B_inside', value: `${m.internalMagneticFieldMt} mT` },
                        { label: 'Height', value: `${m.levitationHeightMm} mm` },
                      ];
                    })()
                  : modelSpec.functionalType === 'black-hole-gravitational-lensing'
                  ? (() => {
                      const m = calculateBlackHoleLensingMetrics({
                        blackHoleMassSolar: parameters.blackHoleMassSolar,
                        impactParameterRs: parameters.impactParameterRs,
                        sourceAlignmentOffset: parameters.sourceAlignmentOffset,
                      });
                      return [
                        { label: 'r_s', value: `${m.schwarzschildRadiusKm} km` },
                        { label: 'Deflect α', value: m.isPhotonCaptured ? 'Captured' : `${m.deflectionAngleDeg}°` },
                        { label: 'r_ph', value: `${m.photonSphereRadiusKm} km` },
                      ];
                    })()
                  : modelSpec.functionalType === 'quantum-tunnelling-explorer'
                  ? (() => {
                      const m = calculateQuantumTunnellingMetrics({
                        particleEnergyEv: parameters.particleEnergyEv,
                        barrierHeightEv: parameters.barrierHeightEv,
                        barrierWidthNm: parameters.barrierWidthNm,
                      });
                      return [
                        { label: 'Regime', value: m.regime === 'tunnelling' ? 'E < V₀' : 'E ≥ V₀' },
                        { label: 'Transmit T', value: `${(m.transmissionProbability * 100).toFixed(1)}%` },
                        { label: 'Reflect R', value: `${(m.reflectionProbability * 100).toFixed(1)}%` },
                      ];
                    })()
                  : modelSpec.functionalType === 'faraday-law-induction-explorer'
                  ? (() => {
                      const m = calculateFaradayInductionMetrics({
                        magnetPosition: parameters.magnetPosition,
                        magnetVelocity: parameters.magnetVelocity,
                        magneticFieldStrength: parameters.magneticFieldStrength,
                        coilTurns: parameters.coilTurns,
                        reverseDirection: Boolean(conditions.reverseDirection),
                        isPlaying,
                      });
                      return [
                        { label: 'Flux Φ_B', value: `${m.instantaneousFluxMwb} mWb` },
                        { label: 'EMF ε', value: `${m.inducedEmfVolts} V` },
                        { label: 'Current I', value: `${m.inducedCurrentMa} mA` },
                      ];
                    })()
                  : modelSpec.functionalType === 'motor-generator-energy-explorer'
                  ? (() => {
                      const m = calculateMotorGeneratorMetrics({
                        operatingMode: String(conditions.operatingMode || 'motor_mode'),
                        supplyVoltage: parameters.supplyVoltage,
                        mechanicalInputRpm: parameters.mechanicalInputRpm,
                        magneticFieldT: parameters.magneticFieldT,
                        loadResistanceOhm: parameters.loadResistanceOhm,
                        reverseDirection: Boolean(conditions.reverseDirection),
                        loadConnected: conditions.loadConnected !== false,
                      });
                      return [
                        { label: 'Mode', value: m.operatingMode === 'motor_mode' ? 'DC Motor' : 'Generator' },
                        { label: 'Torque τ', value: `${m.electromagneticTorqueNm} N·m` },
                        { label: 'Speed', value: `${m.rotationalSpeedRpm} RPM` },
                      ];
                    })()
                  : modelSpec.functionalType === 'ac-voltage-transformer-explorer'
                  ? (() => {
                      const m = calculateTransformerCouplingMetrics({
                        primaryVoltageV: parameters.primaryVoltageV,
                        acFrequencyHz: parameters.acFrequencyHz,
                        primaryTurnsNp: parameters.primaryTurnsNp,
                        secondaryTurnsNs: parameters.secondaryTurnsNs,
                        transformerPreset: String(conditions.transformerPreset || 'custom'),
                        loadConnected: conditions.loadConnected !== false,
                      });
                      return [
                        { label: 'Type', value: m.modeClassification.toUpperCase() },
                        { label: 'V_s (RMS)', value: `${m.loadedSecondaryVoltageV} V` },
                        { label: 'Power P', value: `${m.powerTransferredWatts} W` },
                      ];
                    })()
                  : modelSpec.functionalType === 'wave-interference-diffraction-lab'
                  ? (() => {
                      const m = calculateWaveInterferenceMetrics({
                        experimentMode: String(conditions.experimentMode || 'two_source_interference'),
                        sourceFrequencyHz: parameters.sourceFrequencyHz,
                        sourceSeparationD: parameters.sourceSeparationD,
                        relativePhaseDeg: parameters.relativePhaseDeg,
                        waveAmplitude: parameters.waveAmplitude,
                        apertureWidth: parameters.apertureWidth,
                        obstacleOffset: parameters.obstacleOffset,
                      });
                      return [
                        { label: 'λ Wave', value: `${m.wavelengthUnits} u` },
                        { label: 'Min θ₁', value: `${m.firstMinimumAngleDeg}°` },
                        { label: 'Maxima', value: `${m.constructiveMaxCount}` },
                      ];
                    })()
                  : modelSpec.functionalType === 'optical-interferometer-explorer'
                  ? (() => {
                      const m = calculateInterferometerMetrics({
                        mirrorDisplacementNm: parameters.mirrorDisplacementNm,
                        wavelengthNm: parameters.wavelengthNm,
                        phaseOffsetDeg: parameters.phaseOffsetDeg,
                        beamContrast: parameters.beamContrast,
                      });
                      return [
                        { label: 'OPD 2Δd', value: `${m.opticalPathDifferenceNm} nm` },
                        { label: 'State', value: m.interferenceState },
                        { label: 'Shift Δm', value: `${m.fringeShiftCount}` },
                      ];
                    })()
                  : modelSpec.functionalType === 'fluid-dynamics-bernoulli-vortex'
                  ? (() => {
                      const m = calculateFluidDynamicsMetrics({
                        inletFlowRateLs: parameters.inletFlowRateLs,
                        throatDiameterRatio: parameters.throatDiameterRatio,
                        fluidDensityKgM3: parameters.fluidDensityKgM3,
                      });
                      return [
                        { label: 'Throat v₂', value: `${m.throatVelocityMs} m/s` },
                        { label: 'ΔP Drop', value: `${m.bernoulliPressureDropKpa} kPa` },
                        { label: 'Vortex f_v', value: `${m.strouhalVortexFreqHz} Hz` },
                      ];
                    })()
                  : modelSpec.functionalType === 'tokamak-fusion-confinement-explorer'
                  ? (() => {
                      const m = calculateTokamakFusionMetrics({
                        toroidalFieldTesla: parameters.toroidalFieldTesla,
                        plasmaCurrentMa: parameters.plasmaCurrentMa,
                        plasmaTemperatureKev: parameters.plasmaTemperatureKev,
                        confinementQualityH: parameters.confinementQualityH,
                      });
                      return [
                        { label: 'Safety q₉₅', value: `${m.edgeSafetyFactorQ95}` },
                        { label: 'P_mag', value: `${m.magneticPressureAtm} atm` },
                        { label: 'nTτ_E Idx', value: `${m.illustrativeTripleProductIndex}` },
                      ];
                    })()
                  : modelSpec.functionalType === 'doppler-effect-sonic-boom-explorer'
                  ? (() => {
                      const m = calculateDopplerSonicBoomMetrics({
                        sourceSpeed: parameters.sourceSpeed,
                        observerSpeed: parameters.observerSpeed,
                        soundSpeed: parameters.soundSpeed,
                        sourceFrequencyHz: parameters.sourceFrequencyHz,
                        motionRegimePreset: String(conditions.motionRegimePreset || 'custom'),
                        sourceDirection: String(conditions.sourceDirection || 'approaching'),
                      });
                      return [
                        { label: 'Mach M', value: `${m.machNumber} (${m.regime})` },
                        { label: 'f_obs', value: `${m.activeObservedFrequencyHz} Hz` },
                        {
                          label: 'Mach Angle μ',
                          value: m.machConeHalfAngleDeg !== null ? `${m.machConeHalfAngleDeg}°` : 'Subsonic (No Cone)',
                        },
                      ];
                    })()
                  : modelSpec.functionalType === 'seismic-waves-earthquake-lab'
                  ? (() => {
                      const m = calculateSeismicWavesMetrics({
                        focusDepthKm: parameters.focusDepthKm,
                        pWaveSpeedKms: parameters.pWaveSpeedKms,
                        sWaveSpeedKms: parameters.sWaveSpeedKms,
                        seismicStationAngleDeg: parameters.seismicStationAngleDeg,
                      });
                      return [
                        { label: 'P Arrival t_P', value: `${m.pWaveArrivalSec} s` },
                        {
                          label: 'S Arrival t_S',
                          value: m.isInSWaveShadowZone ? 'Blocked (Shadow)' : `${m.sWaveArrivalSec} s`,
                        },
                        { label: 'Δt (S−P)', value: m.spLagTimeSec !== null ? `${m.spLagTimeSec} s` : 'Shadow Zone' },
                      ];
                    })()
                  : modelSpec.functionalType === 'gyroscope-torque-angular-momentum-lab'
                  ? (() => {
                      const m = calculateGyroscopeMetrics({
                        rotorSpinSpeedRpm: parameters.rotorSpinSpeedRpm,
                        appliedTorqueNm: parameters.appliedTorqueNm,
                        rotorTiltAngleDeg: parameters.rotorTiltAngleDeg,
                        rotorInertiaKgm2: parameters.rotorInertiaKgm2,
                        spinDirection: String(conditions.spinDirection || 'ccw_positive'),
                      });
                      return [
                        { label: 'Spin |L|', value: `${m.spinAngularMomentumKgm2S} kg·m²/s` },
                        { label: 'Torque |τ|', value: `${m.appliedTorqueNm} N·m` },
                        { label: 'Precess Ω_p', value: `${m.precessionAngularVelocityRadS} rad/s` },
                      ];
                    })()
                  : modelSpec.functionalType === 'shm-coupled-oscillators-lab'
                  ? (() => {
                      const m = calculateShmCoupledMetrics({
                        massKg: parameters.massKg,
                        springStiffnessNm: parameters.springStiffnessNm,
                        couplingStiffnessNm: parameters.couplingStiffnessNm,
                        initialDisplacementM: parameters.initialDisplacementM,
                        dampingCoefficient: parameters.dampingCoefficient,
                        oscillatorPreset: String(conditions.oscillatorPreset || 'weakly_coupled'),
                      });
                      return [
                        { label: 'ω₁ / ω₂', value: `${m.inPhaseModeOmegaRadS} / ${m.outOfPhaseModeOmegaRadS} rad/s` },
                        { label: 'Beat f_beat', value: `${m.beatFrequencyHz} Hz` },
                        { label: 'Total E', value: `${m.totalMechanicalEnergyJ} J` },
                      ];
                    })()
                  : modelSpec.functionalType === 'thermodynamics-carnot-heat-engine'
                  ? (() => {
                      const m = calculateCarnotEngineMetrics({
                        hotReservoirTempK: parameters.hotReservoirTempK,
                        coldReservoirTempK: parameters.coldReservoirTempK,
                        heatInputQhKj: parameters.heatInputQhKj,
                        cycleSpeedRpm: parameters.cycleSpeedRpm,
                        engineCycleMode: String(conditions.engineCycleMode || 'ideal_carnot'),
                      });
                      return [
                        {
                          label: 'η_Carnot',
                          value: m.isValidTemperatureGradient ? `${m.activeEfficiencyPct}%` : 'Clamped (T_H≤T_C)',
                        },
                        { label: 'Net Work W', value: `${m.workOutputWKj} kJ` },
                        { label: 'Q_H / Q_C', value: `${m.heatInputQhKj} / ${m.heatRejectedQcKj} kJ` },
                      ];
                    })()
                  : modelSpec.functionalType === 'photoelectric-effect-quantum-explorer'
                  ? (() => {
                      const m = calculatePhotoelectricMetrics({
                        lightFrequencyThz: parameters.lightFrequencyThz,
                        lightIntensityPct: parameters.lightIntensityPct,
                        workFunctionEv: parameters.workFunctionEv,
                        retardingVoltageV: parameters.retardingVoltageV,
                        metalPreset: String(conditions.metalPreset || 'custom'),
                      });
                      return [
                        { label: 'E_photon = hf', value: `${m.photonEnergyEv} eV` },
                        { label: 'K_max = hf−Φ', value: m.isAboveThreshold ? `${m.maxKineticEnergyEv} eV` : '0 eV (f < f₀)' },
                        { label: 'V_stop', value: `${m.stoppingPotentialV} V` },
                      ];
                    })()
                  : modelSpec.functionalType === 'special-relativity-time-length-lab'
                  ? (() => {
                      const m = calculateSpecialRelativityMetrics({
                        velocityFractionC: parameters.velocityFractionC,
                        properLengthMeters: parameters.properLengthMeters,
                        properTimeIntervalNs: parameters.properTimeIntervalNs,
                      });
                      return [
                        { label: 'Lorentz γ', value: `${m.lorentzFactorGamma}×` },
                        { label: 'Δt = γΔτ', value: `${m.coordinateTimeIntervalNs} ns` },
                        { label: 'L = L₀/γ', value: `${m.contractedLengthMeters} m` },
                      ];
                    })()
                  : [
                      { label: 'Components', value: modelSpec.parts.length },
                      { label: 'Active Params', value: Object.keys(parameters).length },
                      { label: 'State', value: isPlaying ? 'Running' : 'Paused' },
                    ]
              }
            >
              <div ref={mountRef} className="w-full h-full relative">

                {/* Newton's Cradle Physics Telemetry & Reset HUD Strip */}
                {(modelSpec.functionalType === 'newtons-cradle' || modelSpec.id.includes('cradle')) && (
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] z-10 space-y-1.5 max-w-xs pointer-events-auto">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Momentum Physics HUD</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          cradleRestartCounterRef.current += 1;
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                        title="Restart swing from initial release angle"
                      >
                        Restart Swing
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-slate-300">
                      <div>Spheres Displaced: <strong className="text-white">{parameters.ballCountDisplaced ?? 1}</strong></div>
                      <div>Release θ₀: <strong className="text-white">{parameters.releaseAngle ?? parameters.releaseHeight ?? 35}°</strong></div>
                      <div>Length L: <strong className="text-white">{parameters.pendulumLength ?? 1.6} m</strong></div>
                      <div>Gravity g: <strong className="text-white">{parameters.gravity ?? 9.8} m/s²</strong></div>
                      <div>Period T: <strong className="text-white">{(2 * Math.PI * Math.sqrt((parameters.pendulumLength ?? 1.6) / (parameters.gravity ?? 9.8))).toFixed(2)} s</strong></div>
                      <div>Restitution e: <strong className="text-white">{parameters.elasticity ?? 0.99}</strong></div>
                    </div>
                  </div>
                )}

                {/* Compact Essential Status Chip for Ionic & Covalent Bonding Explorer */}
                {modelSpec.functionalType === 'bonding-explorer' && (
                  <div className="absolute top-14 left-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-xs z-10 flex items-center gap-2 pointer-events-auto">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {conditions.example === 'hydrogen_gas' ? '2 e⁻' : '8 e⁻'} Conserved
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-sky-950 text-sky-300 border border-sky-800/60">
                      {conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                        ? 'Covalent'
                        : 'Ionic'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBondingInfoExpanded(true);
                        const el = document.getElementById('bonding-dedicated-panel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[10px] text-sky-300 hover:text-sky-200 font-medium ml-1 underline cursor-pointer"
                    >
                      Accounting ▾
                    </button>
                  </div>
                )}

                {/* Heat Transfer Physics Telemetry & Real-Time Simulation HUD */}
                {(modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer') && (
                  <div className="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700/80 shadow-xl text-xs z-10 space-y-2.5 max-w-sm pointer-events-auto">
                    {/* Header: Mode & Controls */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Thermal Physics HUD</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlaying ? 'Pause' : 'Start'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            heatRestartCounterRef.current += 1;
                          }}
                          className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reset simulation to initial ambient temperature"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      {(['conduction', 'convection', 'radiation'] as const).map((m) => {
                        const isActive = (conditions.transferMode || 'conduction') === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              if (onUpdateCondition) onUpdateCondition('transferMode', m);
                              else setInternalConditions((prev) => ({ ...prev, transferMode: m }));
                            }}
                            className={`flex-1 py-1 rounded font-medium capitalize text-center transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mode Specific Dynamic Telemetry */}
                    {(!conditions.transferMode || conditions.transferMode === 'conduction') && (
                      <div className="space-y-1.5 text-[10px] text-slate-300">
                        <div className="flex items-center justify-between font-mono">
                          <span>Conductor Material:</span>
                          <strong className="text-white">
                            {HEAT_MATERIALS[conditions.rodMaterial || 'copper']?.name || 'Pure Copper'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span>Conductivity k:</span>
                          <span className="text-amber-300 font-bold">
                            {parameters.thermalConductivity ?? 390} W/(m·K)
                          </span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                            Live Calculated Probes (Fourier Diffusion)
                          </span>
                          <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                            <div>Contact (x=0): <strong className="text-red-400">{parameters.heatSourceTempC ?? 200}°C</strong></div>
                            <div>Midpoint: <strong className="text-amber-400">{heatTelemetryState?.conductionTemps?.[6] ? `${heatTelemetryState.conductionTemps[6].toFixed(1)}°C` : `${((parameters.heatSourceTempC ?? 200) * 0.45).toFixed(1)}°C`}</strong></div>
                            <div>Far Tip: <strong className="text-slate-300">{heatTelemetryState?.conductionTemps?.[11] ? `${heatTelemetryState.conductionTemps[11].toFixed(1)}°C` : `${(parameters.initialTempC ?? 20).toFixed(1)}°C`}</strong></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span>Fourier Heat Flux q:</span>
                          <span className="text-emerald-400 font-bold">
                            {((((parameters.thermalConductivity ?? 390) * ((parameters.heatSourceTempC ?? 200) - (parameters.initialTempC ?? 20))) / 3.8) * 0.05).toFixed(1)} kW/m² ➔
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">
                          Fourier's Law: dQ/dt = -k·A·dT/dx. Heat propagates segment-by-segment down the temperature gradient over time.
                        </p>
                      </div>
                    )}

                    {conditions.transferMode === 'convection' && (
                      <div className="space-y-1.5 text-[10px] text-slate-300">
                        <div className="flex items-center justify-between font-mono">
                          <span>Buoyancy Regime:</span>
                          <strong className="text-amber-300 font-semibold">
                            {calculateConvectionMetrics(parameters.heatSourceTempC ?? 200, parameters.initialTempC ?? 20).rayleighFactor}
                          </strong>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span>Rising Plume (Low Density):</span>
                            <strong className="text-red-400">
                              {calculateConvectionMetrics(parameters.heatSourceTempC ?? 200, parameters.initialTempC ?? 20).risingPlumeTempC}°C
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Top Surface Dissipation:</span>
                            <strong className="text-amber-400">
                              {calculateConvectionMetrics(parameters.heatSourceTempC ?? 200, parameters.initialTempC ?? 20).topSurfaceTempC}°C
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Sinking Wall Current (Dense):</span>
                            <strong className="text-slate-300">
                              {calculateConvectionMetrics(parameters.heatSourceTempC ?? 200, parameters.initialTempC ?? 20).sinkingReturnTempC}°C
                            </strong>
                          </div>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span>Circulation Speed:</span>
                          <span className="text-emerald-400 font-bold">
                            {calculateConvectionMetrics(parameters.heatSourceTempC ?? 200, parameters.initialTempC ?? 20).fluidVelocityMs} m/s
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">
                          Boussinesq Buoyancy: Warmer, less-dense fluid rises in the core; cooler, denser fluid sinks along the walls completing the closed loop.
                        </p>
                      </div>
                    )}

                    {conditions.transferMode === 'radiation' && (
                      <div className="space-y-1.5 text-[10px] text-slate-300">
                        <div className="flex items-center justify-between font-mono">
                          <span>Emitter Temp T₁:</span>
                          <strong className="text-red-400">
                            {parameters.heatSourceTempC ?? 200}°C ({(parameters.heatSourceTempC ?? 200) + 273.15} K)
                          </strong>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span>Surface Emissivity ε:</span>
                          <strong className="text-amber-300 font-bold">
                            {parameters.radiationEmissivity ?? 0.85}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span>Medium Across Gap:</span>
                          <span className="text-emerald-400 font-semibold">
                            Vacuum / Air (No matter required)
                          </span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span>Radiated Power P (Stefan-Boltzmann):</span>
                            <strong className="text-amber-400">
                              {calculateRadiationMetrics(parameters.heatSourceTempC ?? 200, parameters.radiationEmissivity ?? 0.85, heatTransferSimRef.current.radiationSimTime, parameters.initialTempC ?? 20).emitterPowerWatts} W
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Absorber Plate Temp T₂(t):</span>
                            <strong className="text-white">
                              {heatTelemetryState?.radiationMetrics?.absorbedReceiverTempC !== undefined
                                ? `${heatTelemetryState.radiationMetrics.absorbedReceiverTempC}°C`
                                : `${calculateRadiationMetrics(parameters.heatSourceTempC ?? 200, parameters.radiationEmissivity ?? 0.85, heatTransferSimRef.current.radiationSimTime, parameters.initialTempC ?? 20).absorbedReceiverTempC}°C`}
                            </strong>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">
                          Stefan-Boltzmann Law: P = ε·σ·A·(T₁⁴ - T_amb⁴). Electromagnetic infrared waves travel across space without requiring direct physical contact.
                        </p>
                      </div>
                    )}

                    {/* Temperature Scale Legend */}
                    <div className="pt-1 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>Cool Ambient ({parameters.initialTempC ?? 20}°C)</span>
                        <span>Hot Source ({parameters.heatSourceTempC ?? 200}°C)</span>
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full"
                        style={{
                          background: 'linear-gradient(to right, #94a3b8, #d97706, #ea580c, #dc2626, #ef4444)',
                        }}
                      />
                    </div>

                    <p className="text-[9px] text-slate-400 leading-tight pt-1 border-t border-slate-800 italic">
                      Educational Physics Model: Real-time 1D transient heat diffusion, Boussinesq density buoyancy approximation, and Stefan-Boltzmann radiation law.
                    </p>
                  </div>
                )}

                {/* Compact Essential Status Chip for Electric Bell Mechanism */}
                {(modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell') && (
                  <div className="absolute top-14 left-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-xs z-10 flex items-center gap-2 pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="font-semibold text-slate-200">
                      Step {bellTelemetryState?.currentStep || 1}/9: {bellTelemetryState?.stepTitle || 'Switch Closes Circuit'}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        bellTelemetryState?.circuitClosed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {bellTelemetryState?.circuitClosed ? 'CLOSED' : 'OPEN'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBellInfoExpanded(true);
                        const el = document.getElementById('electric-bell-dedicated-panel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[10px] text-amber-300 hover:text-amber-200 font-medium ml-1 underline cursor-pointer"
                    >
                      Cycle Details ▾
                    </button>
                  </div>
                )}



                {/* Universal External Scientific Callout Overlay */}
                <ExternalCalloutOverlay
                  items={screenLabels}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                  onSelectPart={(id) => {
                    const p = modelSpec.parts.find((part) => part.id === id);
                    if (p) handleSelectPart(inspectedPart?.id === p.id ? null : p);
                  }}
                  showLabels={showLabels}
                />
              </div>
            </Global3DViewer>

            {/* Dedicated Information Panel for Electric Bell Mechanism (OUTSIDE the 3D canvas) */}
            {(modelSpec.functionalType === 'electric-bell' || modelSpec.id === 'electric-bell') && (
              <div id="electric-bell-dedicated-panel" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3 transition-all text-slate-700">
                {/* Header with Title, Status & Expand/Collapse Toggle */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Electric Bell Interrupter Cycle & Telemetry
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                          Step {bellTelemetryState?.currentStep || 1} of 9
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Self-interrupting make-and-break electromechanical oscillation
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBellInfoExpanded(!isBellInfoExpanded)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title={isBellInfoExpanded ? 'Collapse panel' : 'Expand panel'}
                  >
                    <span>{isBellInfoExpanded ? 'Hide Details' : 'Show Details'}</span>
                    {isBellInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isBellInfoExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* Coordinated 9-Step Bell Cycle Stepper */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Coordinated Cycle Progress:</span>
                        </span>
                        <span className="font-mono text-amber-700 font-bold text-[11px]">
                          Step {bellTelemetryState?.currentStep || 1} of 9
                        </span>
                      </div>

                      {/* Stepper Dots */}
                      <div className="grid grid-cols-9 gap-1 py-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => {
                          const isCurrent = (bellTelemetryState?.currentStep || 1) === step;
                          return (
                            <div
                              key={step}
                              className={`h-1.5 rounded-full transition-all ${
                                isCurrent ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-200'
                              }`}
                              title={`Step ${step}`}
                            />
                          );
                        })}
                      </div>

                      <div className="text-xs font-semibold text-slate-900">
                        {bellTelemetryState?.stepTitle || 'Switch Closes Circuit'}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {bellTelemetryState?.stepDescription ||
                          'The master control switch completes the primary circuit path, allowing current to flow from the battery source into the electromagnet bobbins.'}
                      </p>
                    </div>

                    {/* Live Physical Telemetry Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Continuity</span>
                        <span className={`font-bold text-[11px] ${bellTelemetryState?.circuitClosed ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {bellTelemetryState?.circuitClosed ? '● CLOSED' : '○ OPEN'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Coil Current (I)</span>
                        <span className="text-slate-900 font-bold text-[11px]">
                          {bellTelemetryState?.circuitCurrent !== undefined ? bellTelemetryState.circuitCurrent.toFixed(2) : '0.00'} A
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Electromagnet</span>
                        <span className={`font-bold text-[11px] ${bellTelemetryState?.electromagnetActive ? 'text-amber-700' : 'text-slate-500'}`}>
                          {bellTelemetryState?.electromagnetActive
                            ? `${bellTelemetryState.magneticForce.toFixed(1)} N`
                            : '0 N (Off)'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Contact Screw</span>
                        <span className={`font-bold text-[11px] ${bellTelemetryState?.contactClosed ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {bellTelemetryState?.contactClosed ? 'Touching' : 'Separated'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Gong Strikes</span>
                        <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-amber-500" />
                          <span>{bellTelemetryState?.strikeCount || 0} rings</span>
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 block text-[10px] font-sans">Oscillation Rate</span>
                        <span className="text-sky-700 font-bold text-[11px]">
                          {bellTelemetryState?.estimatedFrequency || parameters.bellRingingSpeed || 15} Hz
                        </span>
                      </div>
                    </div>

                    {/* Educational Physics Approximation Note */}
                    <p className="text-[11px] text-slate-500 leading-normal italic pt-1 border-t border-slate-100">
                      Governed by self-interrupting electromechanical make-and-break oscillation: Ohm's Law (I = V/R), Ampère-Maxwell magnetic induction, and Hooke's elastic restoring spring force.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dedicated Information Panel for Ionic & Covalent Bonding (OUTSIDE the 3D canvas) */}
            {modelSpec.functionalType === 'bonding-explorer' && (
              <div id="bonding-dedicated-panel" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3 transition-all text-slate-700">
                {/* Header with Title, Mode & Expand/Collapse Toggle */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Valence Electron Accounting & Bonding Mechanism
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                          {conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                            ? 'Covalent (Pair Sharing)'
                            : 'Ionic (Electron Transfer)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Interactive comparative analysis of electron sharing vs electrostatic transfer
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBondingInfoExpanded(!isBondingInfoExpanded)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title={isBondingInfoExpanded ? 'Collapse panel' : 'Expand panel'}
                  >
                    <span>{isBondingInfoExpanded ? 'Hide Details' : 'Show Details'}</span>
                    {isBondingInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isBondingInfoExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* Electron Accounting Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Total Valence Electrons
                        </span>
                        <div className="text-base font-bold font-mono text-emerald-700">
                          {conditions.example === 'hydrogen_gas' ? '2 e⁻' : '8 e⁻'}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Strictly conserved: sum of reacting valence shells
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Conservation Audit
                        </span>
                        <div className="text-base font-bold font-mono text-slate-800">
                          0 e⁻ Lost / Created
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Zero net electron loss across all bond formations
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Bonding Mechanism
                        </span>
                        <div className="text-xs font-bold text-sky-800">
                          {conditions.example === 'water'
                            ? '2 Shared Pairs (σ) + 2 Lone Pairs'
                            : conditions.example === 'methane'
                            ? '4 Shared Pairs (sp³ Tetrahedral)'
                            : conditions.example === 'hydrogen_gas'
                            ? '1 Shared Pair (H-H single bond)'
                            : 'Complete Transfer: Metal ➔ Nonmetal'}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                            ? 'Electrons localized in shared covalent bonding orbitals'
                            : 'Electrostatic Coulombic attraction between ions'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Resulting Configuration
                        </span>
                        <div className="text-xs font-bold text-indigo-800">
                          {conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                            ? 'Stable Noble-Gas Duet/Octet'
                            : 'Cation (+1) · Anion (-1) Lattice'}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {conditions.example === 'water' || conditions.example === 'methane' || conditions.example === 'hydrogen_gas'
                            ? 'Satisfies the octet/duet rule through mutual sharing'
                            : 'Held by 3D ionic crystal lattice packing energy'}
                        </p>
                      </div>
                    </div>

                    {/* Educational Representation Notice */}
                    <p className="text-[11px] text-slate-500 leading-normal italic pt-1 border-t border-slate-100">
                      Pedagogical Notice: Concentric shell and Lewis representations are educational models illustrating valence electron counts and octet rules, rather than complete quantum wavefunctions (ψ²).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Educational Explanation Box (Directly underneath the 3D window on left column) */}
            <EducationalExplanationBox
              data={
                inspectedPart
                  ? {
                      title: getComponentDisplayName(inspectedPart),
                      badge: 'Selected 3D Component Subassembly',
                      subtitle: `Modular Component of ${modelSpec.title}`,
                      whatIsIt:
                        inspectedPart.whatIsIt ||
                        inspectedPart.description ||
                        `The ${getComponentDisplayName(inspectedPart)} is an essential physical part of this ${modelSpec.concept} model.`,
                      structure:
                        (inspectedPart as any).structure ||
                        `Engineered with ${inspectedPart.material || 'standard'} finish, measuring [${inspectedPart.dimensions.join(', ')}], positioned at coordinates [${inspectedPart.position.map((v) => v.toFixed(1)).join(', ')}].`,
                      whatDoesItDo:
                        inspectedPart.whatDoesItDo ||
                        inspectedPart.description ||
                        `Interacts mechanically and physically with surrounding components to perform its designated scientific role.`,
                      whyIsItImportant:
                        (inspectedPart as any).whyIsItImportant ||
                        `Critical for the overall operational integrity, efficiency, and scientific mechanism of ${modelSpec.title}.`,
                      realLifeExample:
                        inspectedPart.realLifeExample ||
                        `Used commonly in everyday machines, physical tools, and scientific lab equipment.`,
                      examConnection: (inspectedPart as any).examConnection || modelSpec.examConnection,
                      whyTitle: '3D COMPONENT INSPECTION FOCUS',
                      whyExplanation: `Currently inspecting ${getComponentDisplayName(inspectedPart)} in 3D subassembly view. Adjust sliders on the right to observe how parameters affect this component.`,
                      onClearSelection: () => handleSelectPart(null),
                    }
                  : {
                      title:
                        modelSpec.functionalType === 'bonding-explorer'
                          ? conditions.example === 'sodium_chloride'
                            ? 'Sodium Chloride (NaCl) Ionic Crystal Bonding'
                            : conditions.example === 'lithium_fluoride'
                            ? 'Lithium Fluoride (LiF) Ionic Bonding'
                            : conditions.example === 'water'
                            ? 'Water (H₂O) Polar Covalent Bonding (104.5°)'
                            : conditions.example === 'methane'
                            ? 'Methane (CH₄) Nonpolar Covalent Tetrahedral (109.5°)'
                            : 'Hydrogen Molecule (H₂) Covalent Single Bond'
                          : modelSpec.title,
                      badge:
                        modelSpec.functionalType === 'bonding-explorer'
                          ? 'Bohr Shell & Lewis Valence Model'
                          : modelSpec.simulationModel === 'illustrative'
                          ? 'Illustrative Scientific Model'
                          : 'Predictive Physical Model',
                      subtitle: modelSpec.concept,
                      whatIsIt: modelSpec.whatIsIt || modelSpec.description,
                      howDoesItWork: modelSpec.howDoesItWork || modelSpec.description,
                      realLifeExample:
                        modelSpec.realLifeExample ||
                        'Everyday machines, tools, and natural systems operate under this fundamental scientific principle.',
                      observation:
                        lastParamWhy?.observation ||
                        (modelSpec.functionalType === 'bonding-explorer'
                          ? `Active example: ${conditions.example || 'sodium_chloride'} at ${parameters.reactionProgress ?? 100}% progress. Electrons strictly conserved: 8 valence electrons.`
                          : undefined),
                      whyTitle: lastParamWhy ? lastParamWhy.title : 'WHY IS THIS HAPPENING IN THE SIMULATION?',
                      whyExplanation: lastParamWhy
                        ? lastParamWhy.why
                        : modelSpec.functionalType === 'bonding-explorer'
                        ? 'Atoms interact to satisfy the octet rule (stable noble-gas electron configurations). Large electronegativity differences (Δχ > 2.0) favor complete electron transfer (ionic bonding held by Coulombic attraction), while small differences favor electron pair sharing (covalent bonding).'
                        : `The 3D model is active with real-time WebGL rendering. Click any component or 3D label to inspect it, or adjust experiment parameters to observe immediate physical changes.`,
                      examConnection: modelSpec.examConnection,
                      formula: modelSpec.equations?.[0],
                    }
              }
            />
          </div>

          {/* RIGHT COLUMN: MODEL-SPECIFIC CONTROLS, PARAMETERS & SUBASSEMBLIES */}
          <div className="lg:col-span-6 flex flex-col gap-4 w-full">
            <div id="ai-model-parameters-deck" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 transition-all">
              {/* Header with Title, Status & PPTX Export */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Model Controls & Parameters
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFullViewerReset}
                    data-testid="retry-reset-viewer-button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Reset camera position, zoom, parameters, and simulation state to initial defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                    <span>Retry / Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Export 3D Model Deck as PowerPoint (.pptx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                    <span>Export .pptx</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {Object.keys(modelSpec.parameters).length} Params
                  </span>
                </div>
              </div>

              {/* Subassembly Quick Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Subassemblies ({modelSpec.parts.length}):</span>
                  {inspectedPart && (
                    <button
                      type="button"
                      onClick={() => handleSelectPart(null)}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-medium cursor-pointer"
                    >
                      Reset Selection
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {modelSpec.parts.map((p) => {
                    const isSelected = inspectedPart?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPart(isSelected ? null : p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {getComponentDisplayName(p)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Parameter Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(modelSpec.parameters).map((param) => {
                  const val = parameters[param.id] ?? param.defaultValue;
                  return (
                    <div key={param.id} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{param.name}</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {val} {param.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={val}
                        onChange={(e) => handleParamSliderChange(param.id, parseFloat(e.target.value))}
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{param.min} {param.unit}</span>
                        <span>{param.max} {param.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conditions & Mode Toggles */}
              {Object.values(modelSpec.conditions).length > 0 && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(modelSpec.conditions).map((cond) => {
                    const val = conditions[cond.id] ?? cond.defaultValue;
                    if (cond.type === 'boolean') {
                      return (
                        <div key={cond.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="font-medium text-slate-700 block">{cond.name}</span>
                            <span className="text-[11px] text-slate-400">{cond.description}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateCondition) {
                                onUpdateCondition(cond.id, !val);
                              } else {
                                setInternalConditions((prev) => ({ ...prev, [cond.id]: !val }));
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              val ? 'bg-slate-900' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                val ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    }
                    if (cond.type === 'select') {
                      return (
                        <div key={cond.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 block">{cond.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono capitalize">{String(val).replace(/_/g, ' ')}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{cond.description}</span>
                          <select
                            value={String(val)}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              if (cond.id === 'rodMaterial' && (modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer')) {
                                const mat = HEAT_MATERIALS[newVal];
                                if (mat) {
                                  if (onUpdateParameter) onUpdateParameter('thermalConductivity', mat.conductivity);
                                  else setInternalParameters((prev) => ({ ...prev, thermalConductivity: mat.conductivity }));
                                  setLastParamWhy({
                                    title: `⚡ MATERIAL CHANGED: ${mat.name.toUpperCase()}`,
                                    observation: `Solid conductor switched to ${mat.name}. Thermal conductivity k set to ${mat.conductivity} W/(m·K).`,
                                    why: `${mat.description} Fourier's law (dQ/dt = -k·A·dT/dx) dictates that heat wave propagation velocity and conductive energy flux scale directly with k.`,
                                  });
                                }
                              } else if (cond.id === 'transferMode' && (modelSpec.functionalType === 'heat-transfer-explorer' || modelSpec.id === 'heat-transfer-explorer')) {
                                const modeExplanations: Record<string, { obs: string; why: string }> = {
                                  conduction: {
                                    obs: 'Active mode: Solid Conduction (Lattice vibrations & free electron collisions).',
                                    why: 'Heat transfers through stationary solids by direct particle-to-particle kinetic energy transfer (phonons and free electron drift) without gross displacement of matter.',
                                  },
                                  convection: {
                                    obs: 'Active mode: Fluid Convection (Density buoyancy circulation loops).',
                                    why: 'Heating fluid lowers its density (Boussinesq thermal expansion), generating buoyant upward displacement. Cooler, denser peripheral fluid sinks to replace it, establishing closed circulation cells.',
                                  },
                                  radiation: {
                                    obs: 'Active mode: Electromagnetic Thermal Radiation (Infrared waves across vacuum).',
                                    why: 'All matter above absolute zero emits electromagnetic radiation governed by Stefan-Boltzmann law (P = ε·σ·A·T⁴). Energy travels across empty space at the speed of light with zero physical contact or material medium.',
                                  },
                                };
                                const exp = modeExplanations[newVal];
                                if (exp) {
                                  setLastParamWhy({
                                    title: `⚡ THERMAL TRANSFER MODE: ${newVal.toUpperCase()}`,
                                    observation: exp.obs,
                                    why: exp.why,
                                  });
                                }
                              }
                              if (onUpdateCondition) {
                                onUpdateCondition(cond.id, newVal);
                              } else {
                                setInternalConditions((prev) => ({ ...prev, [cond.id]: newVal }));
                              }
                            }}
                            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                          >
                            {cond.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Live Scientific Readout & Regime Diagnostics for Physics Batch 3 (Models 55–61) */}
              {isAdvancedPhysicsBatch3Model(modelSpec.functionalType, modelSpec.id) && (
                <div
                  data-testid="batch3-scientific-readout-panel"
                  className="pt-3 border-t border-slate-100 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-teal-600" />
                      <span>Live Physics Readouts & Regime Status</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                      Real-Time Solver
                    </span>
                  </div>

                  {modelSpec.functionalType === 'doppler-effect-sonic-boom-explorer' && (() => {
                    const m = calculateDopplerSonicBoomMetrics({
                      sourceSpeed: parameters.sourceSpeed,
                      observerSpeed: parameters.observerSpeed,
                      soundSpeed: parameters.soundSpeed,
                      sourceFrequencyHz: parameters.sourceFrequencyHz,
                      motionRegimePreset: String(conditions.motionRegimePreset || 'custom'),
                      sourceDirection: String(conditions.sourceDirection || 'approaching'),
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Mach Number M = v_s/v</span>
                            <strong className="text-sky-400">{m.machNumber} ({m.regime.toUpperCase()})</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Emitted / Observed f</span>
                            <strong className="text-emerald-400">{m.emittedFrequencyHz} Hz ➔ {m.activeObservedFrequencyHz} Hz</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Mach Cone Half-Angle μ</span>
                            <strong className="text-amber-300">
                              {m.machConeHalfAngleDeg !== null ? `${m.machConeHalfAngleDeg}° (sin μ = 1/M)` : 'None (M < 1 Subsonic)'}
                            </strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-snug">
                          {m.isSupersonic
                            ? 'Supersonic Regime (M ≥ 1): Expanding spherical wavefronts constructively overlap along the conical Mach shock envelope.'
                            : `Subsonic Regime (M < 1): Front wavelength compressed to ${m.compressedFrontWavelengthM} m; rear wavelength expanded to ${m.expandedRearWavelengthM} m.`}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'seismic-waves-earthquake-lab' && (() => {
                    const m = calculateSeismicWavesMetrics({
                      focusDepthKm: parameters.focusDepthKm,
                      pWaveSpeedKms: parameters.pWaveSpeedKms,
                      sWaveSpeedKms: parameters.sWaveSpeedKms,
                      seismicStationAngleDeg: parameters.seismicStationAngleDeg,
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Station Angle Δ</span>
                            <strong className="text-sky-400">{m.stationAngleDeg}° ({m.epicentralSurfaceDistanceKm} km)</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">P-Wave Arrival</span>
                            <strong className="text-cyan-300">{m.pWaveArrivalSec} s</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">S-Wave Arrival</span>
                            <strong className={m.isInSWaveShadowZone ? 'text-rose-400' : 'text-amber-300'}>
                              {m.isInSWaveShadowZone ? 'BLOCKED (μ=0)' : `${m.sWaveArrivalSec} s`}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">S–P Lag / Surface</span>
                            <strong className="text-emerald-400">
                              {m.spLagTimeSec !== null ? `Δt=${m.spLagTimeSec}s` : 'Shadow'} / {m.surfaceWaveArrivalSec}s
                            </strong>
                          </div>
                        </div>
                        {m.isInSWaveShadowZone && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-[11px] font-sans">
                            S-Wave Shadow Zone (Δ &gt; 103°): Transverse shear waves cannot propagate through Earth&apos;s liquid iron outer core because liquid shear modulus μ = 0.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'gyroscope-torque-angular-momentum-lab' && (() => {
                    const m = calculateGyroscopeMetrics({
                      rotorSpinSpeedRpm: parameters.rotorSpinSpeedRpm,
                      appliedTorqueNm: parameters.appliedTorqueNm,
                      rotorTiltAngleDeg: parameters.rotorTiltAngleDeg,
                      rotorInertiaKgm2: parameters.rotorInertiaKgm2,
                      spinDirection: String(conditions.spinDirection || 'ccw_positive'),
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Inertia I</span>
                            <strong className="text-slate-200">{m.rotorInertiaKgm2} kg·m²</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Spin |L| = Iω</span>
                            <strong className="text-sky-400">{m.spinAngularMomentumKgm2S} kg·m²/s</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Applied Torque |τ|</span>
                            <strong className="text-amber-400">{m.appliedTorqueNm} N·m</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Precession Ω_p = τ/(L sinθ)</span>
                            <strong className="text-emerald-400">{m.precessionAngularVelocityRadS} rad/s</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'shm-coupled-oscillators-lab' && (() => {
                    const m = calculateShmCoupledMetrics({
                      massKg: parameters.massKg,
                      springStiffnessNm: parameters.springStiffnessNm,
                      couplingStiffnessNm: parameters.couplingStiffnessNm,
                      initialDisplacementM: parameters.initialDisplacementM,
                      dampingCoefficient: parameters.dampingCoefficient,
                      oscillatorPreset: String(conditions.oscillatorPreset || 'weakly_coupled'),
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">In-Phase ω₁ = √(k/m)</span>
                            <strong className="text-sky-400">{m.inPhaseModeOmegaRadS} rad/s</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Anti-Phase ω₂</span>
                            <strong className="text-violet-400">{m.outOfPhaseModeOmegaRadS} rad/s</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Beat Frequency f_beat</span>
                            <strong className="text-amber-300">{m.beatFrequencyHz} Hz</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Energy K + U = E_tot</span>
                            <strong className="text-emerald-400">{m.totalMechanicalEnergyJ} J</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'thermodynamics-carnot-heat-engine' && (() => {
                    const m = calculateCarnotEngineMetrics({
                      hotReservoirTempK: parameters.hotReservoirTempK,
                      coldReservoirTempK: parameters.coldReservoirTempK,
                      heatInputQhKj: parameters.heatInputQhKj,
                      cycleSpeedRpm: parameters.cycleSpeedRpm,
                      engineCycleMode: String(conditions.engineCycleMode || 'ideal_carnot'),
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Carnot η = 1 − T_C/T_H</span>
                            <strong className={m.isValidTemperatureGradient ? 'text-emerald-400' : 'text-rose-400'}>
                              {m.activeEfficiencyPct}%
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Heat Input Q_H</span>
                            <strong className="text-rose-400">{m.heatInputQhKj} kJ</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Heat Rejected Q_C</span>
                            <strong className="text-sky-400">{m.heatRejectedQcKj} kJ</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Net Cycle Work W</span>
                            <strong className="text-amber-300">{m.workOutputWKj} kJ</strong>
                          </div>
                        </div>
                        {m.restrictionWarning && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/90 border border-rose-700 text-rose-200 text-[11px] font-sans">
                            ⚠️ {m.restrictionWarning}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'photoelectric-effect-quantum-explorer' && (() => {
                    const m = calculatePhotoelectricMetrics({
                      lightFrequencyThz: parameters.lightFrequencyThz,
                      lightIntensityPct: parameters.lightIntensityPct,
                      workFunctionEv: parameters.workFunctionEv,
                      retardingVoltageV: parameters.retardingVoltageV,
                      metalPreset: String(conditions.metalPreset || 'custom'),
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Cathode Φ</span>
                            <strong className="text-amber-300">{m.workFunctionEv} eV (f₀={m.thresholdFrequencyThz} THz)</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Photon E = hf (λ={m.wavelengthNm}nm)</span>
                            <strong className="text-sky-400">{m.photonEnergyEv} eV</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">K_max = hf − Φ</span>
                            <strong className={m.isAboveThreshold ? 'text-emerald-400' : 'text-rose-400'}>
                              {m.maxKineticEnergyEv} eV
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">V_stop / Photocurrent</span>
                            <strong className="text-violet-300">{m.stoppingPotentialV} V / {m.photocurrentMicroAmps} μA</strong>
                          </div>
                        </div>
                        {!m.isAboveThreshold && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-rose-300 text-[11px] font-sans">
                            Below Threshold Frequency (f &lt; f₀): Photon energy hf = {m.photonEnergyEv} eV is less than metal work function Φ = {m.workFunctionEv} eV. Zero photoelectrons are emitted regardless of light intensity.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'special-relativity-time-length-lab' && (() => {
                    const m = calculateSpecialRelativityMetrics({
                      velocityFractionC: parameters.velocityFractionC,
                      properLengthMeters: parameters.properLengthMeters,
                      properTimeIntervalNs: parameters.properTimeIntervalNs,
                    });
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono border border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Speed β = v/c</span>
                            <strong className="text-sky-400">{m.velocityFractionC} c ({m.velocityKmS} km/s)</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Lorentz Factor γ</span>
                            <strong className="text-amber-300">{m.lorentzFactorGamma}×</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Time Dilation Δt = γΔτ</span>
                            <strong className="text-emerald-400">{m.properTimeIntervalNs}ns ➔ {m.coordinateTimeIntervalNs}ns</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Length L = L₀/γ</span>
                            <strong className="text-violet-300">{m.properLengthMeters}m ➔ {m.contractedLengthMeters}m</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* =========================================================================
                  PHYSICS BATCH 4 (MODELS 62–68): LIVE SCIENTIFIC READOUT PANEL
                  ========================================================================= */}
              {isAdvancedPhysicsBatch4Model(modelSpec.functionalType, modelSpec.id) && (
                <div className="pt-3 border-t border-slate-100">
                  {modelSpec.functionalType === 'maxwell-equations-em-field-explorer' && (() => {
                    const m = calculateMaxwellEquationsMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Maxwell's Four Equations Telemetry
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            c = 1/√(μ₀ε₀) = 299.8 Mm/s
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Gauss E-Flux (Φ_E = q₁/ε₀)</span>
                            <strong className="text-amber-300">{m.electricFluxMegaVm} MV·m (q₁={m.q1MicroC} μC)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Gauss B-Flux (∮ B·dA)</span>
                            <strong className="text-sky-300">{m.magneticClosedSurfaceFluxWb.toFixed(3)} Wb (No Monopoles)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Ampère–Maxwell B (r=0.25m)</span>
                            <strong className="text-emerald-300">{m.magneticFieldAtRefRadiusMicroT} μT (I_d={m.displacementCurrentAmps} A)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Faraday EMF & EM Wave λ</span>
                            <strong className="text-purple-300">|ℰ|={m.inducedFaradayEmfVolts} V • λ={m.emWavelengthMeters} m</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'ac-circuits-rlc-resonance-lab' && (() => {
                    const m = calculateAcRlcCircuitMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            AC Impedance & RLC Resonance Readout
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            {m.regimeLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Reactances (X_L vs X_C)</span>
                            <strong className="text-purple-300">X_L={m.inductiveReactanceOhms} Ω • X_C={m.capacitiveReactanceOhms} Ω</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Impedance Z & Phase φ</span>
                            <strong className="text-sky-300">Z={m.impedanceOhms} Ω • φ={m.phaseAngleDeg}°</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Peak vs RMS Current</span>
                            <strong className="text-emerald-300">I_peak={m.peakCurrentAmps} A • I_rms={m.rmsCurrentAmps} A</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Resonance f₀ & Power P_avg</span>
                            <strong className="text-amber-300">f₀={m.resonanceFrequencyHz} Hz • P={m.realPowerWatts} W</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'lenses-optical-instruments-lab' && (() => {
                    const m = calculateThinLensOpticsMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            Cartesian Thin-Lens Telemetry (1/f = 1/v − 1/u)
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            {m.imageNature} • {m.imageOrientation}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Focal Length f & Power P</span>
                            <strong className="text-sky-300">f={m.focalLengthCm > 0 ? `+${m.focalLengthCm}` : m.focalLengthCm} cm ({m.opticalPowerDiopters} D)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Object u & Image v</span>
                            <strong className="text-amber-300">u={m.objectCoordUCm} cm ➔ v={m.isAtInfinity ? '∞' : `${m.imageCoordVCm > 0 ? '+' : ''}${m.imageCoordVCm} cm`}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Magnification m = v/u</span>
                            <strong className="text-rose-300">m = {m.lateralMagnificationM > 0 ? `+${m.lateralMagnificationM}` : m.lateralMagnificationM}× (h_i={m.imageHeightCm} cm)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Instrument Angular Mag</span>
                            <strong className="text-indigo-300">|M_inst| = {m.instrumentAngularMagnification}×</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'doppler-ultrasound-flow-explorer' && (() => {
                    const m = calculateDopplerUltrasoundMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Doppler Ultrasound Telemetry (Educational Model)
                          </span>
                          <span className="text-[11px] font-mono text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded">
                            {m.motionStateLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Doppler Shift Δf = 2f₀v cosθ/c</span>
                            <strong className="text-emerald-300">{m.dopplerShiftHz >= 0 ? `+${m.dopplerShiftHz}` : m.dopplerShiftHz} Hz ({m.dopplerShiftKhz} kHz)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Beam Angle θ & cos θ</span>
                            <strong className="text-amber-300">θ = {m.beamAngleDeg}° (cos θ = {m.cosTheta})</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Received Echo Frequency f_R</span>
                            <strong className="text-sky-300">{m.receivedFrequencyMhz} MHz (c = {m.acousticSpeedMs} m/s)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Pulse-Echo Round-Trip Time</span>
                            <strong className="text-pink-300">t_echo = {m.pulseEchoRoundTripMicroSec} μs (d = {m.vesselDepthCm} cm)</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'earth-magnetic-field-magnetosphere-explorer' && (() => {
                    const m = calculateEarthMagnetosphereMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            Geospace & Magnetosphere Telemetry
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            {m.geomagneticStormLevel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Solar Wind Ram Pressure P_dyn</span>
                            <strong className="text-amber-300">{m.dynamicPressureNpa} nPa (v={m.solarWindVelocityKms} km/s)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Magnetopause Standoff R_mp</span>
                            <strong className="text-sky-300">{m.magnetopauseStandoffRe} R_E (Bow Shock {m.bowShockStandoffRe} R_E)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Surface Field (Eq / Pole)</span>
                            <strong className="text-purple-300">{m.equatorialSurfaceFieldMicroT} μT / {m.polarSurfaceFieldMicroT} μT</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Dipole Tilt & Auroral Oval</span>
                            <strong className="text-emerald-300">Tilt {m.dipoleTiltDeg}° • Lat ±{m.auroralLatitudeDeg}°</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'semiconductor-pn-junction-diode-explorer' && (() => {
                    const m = calculateSemiconductorPnJunctionMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            {m.materialName} p–n Junction Readout
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            {m.conductionRegime}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Band Gap E_g & Built-In V_bi</span>
                            <strong className="text-sky-300">E_g = {m.bandGapEv} eV • V_bi = {m.builtInPotentialV} V</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Barrier Height q(V_bi − V)</span>
                            <strong className="text-amber-300">{m.barrierPotentialEv} eV (W = {m.depletionWidthMicrons} μm)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Shockley Diode Current I_D</span>
                            <strong className="text-emerald-300">{m.diodeCurrentMa} mA (V_bias = {m.appliedBiasV} V)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Thermal Voltage V_T = k_BT/q</span>
                            <strong className="text-rose-300">{m.thermalVoltageMv} mV (T = {m.temperatureKelvin} K)</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'radioactive-decay-halflife-radiation-lab' && (() => {
                    const m = calculateRadioactiveDecayMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Nuclear Half-Life & Radiation Attenuation
                          </span>
                          <span className="text-[11px] font-mono text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded">
                            Geiger Counter: {m.geigerCountRateCps} CPS
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Half-Life t₁/₂ & Decay Constant λ</span>
                            <strong className="text-amber-300">t₁/₂ = {m.halfLifeSeconds} s • λ = {m.decayConstantPerSec} s⁻¹</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Initial N₀ & Activity A₀</span>
                            <strong className="text-sky-300">N₀ = {m.initialNucleiCount} • A = {m.instantaneousActivityBq} Bq</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">α / β⁻ Barrier Transmission</span>
                            <strong className="text-rose-300">α: {m.alphaTransmissionPct}% • β⁻: {m.betaTransmissionPct}%</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">γ Transmission (Lead {m.leadShieldThicknessMm} mm)</span>
                            <strong className="text-emerald-300">γ: {m.gammaTransmissionPct}% (B = {m.deflectionFieldTesla} T)</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Live Scientific Readout, Equations & Calculators for Chemistry Batch 1 (Models 69–75) */}
              {isChemistryBatch1Model(modelSpec.functionalType, modelSpec.id) && (
                <div
                  data-testid="chemistry-batch1-readout-panel"
                  className="pt-3 border-t border-slate-100 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Live Chemistry Calculations & State Readout</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                      Real-Time Solver
                    </span>
                  </div>

                  {modelSpec.functionalType === 'molecular-orbital-explorer' && (() => {
                    const m = calculateMolecularOrbitalMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.orbitalLabel} • {m.interactionSymmetry}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            Bond Order = {m.bondOrder} ({m.magneticProperty})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">LCAO Wavefunction & Overlap S(R)</span>
                            <strong className="text-sky-300">{m.wavefunctionFormula} (S = {m.overlapIntegralS})</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">MO Energy Splitting (Qualitative/Ref)</span>
                            <strong className="text-emerald-300">E_bond = {m.bondingOrbitalEnergyEv} eV • E_anti = {m.antibondingOrbitalEnergyEv} eV</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Pauli Electron Occupancy</span>
                            <strong className="text-amber-300">{m.electronConfigurationLabel}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Nodal Surfaces (ψ = 0)</span>
                            <strong className="text-rose-300">{m.nodalPlanesCount} Node(s): {m.nodalPlaneDescription}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Phase vs Charge Convention: Cyan (+ψ) and Rose (−ψ) indicate algebraic wavefunction phase sign, NOT electrical charge. Isosurfaces enclose ~90% electron probability density rather than a hard physical boundary.
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'atomic-orbital-probability-explorer' && (() => {
                    const m = calculateAtomicOrbitalMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            {m.standardOrbitalName}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            n = {m.principalQuantumNumberN}, l = {m.angularMomentumQuantumNumberL}, {m.magneticQuantumLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Exact Quantum Node Counts</span>
                            <strong className="text-amber-300">Radial (n−l−1) = {m.radialNodesCount} • Angular (l) = {m.angularNodesCount} • Total = {m.totalNodesCount}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Orientation & Peak Radial Distance</span>
                            <strong className="text-sky-300">{m.orientationAxisLabel} (r_mp ≈ {m.mostProbableRadiusBohr} a₀)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Shape & Nodal Geometry</span>
                            <strong className="text-emerald-300">{m.shapeDescription} {m.nodalGeometryDescription}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.densityInterpretation} Electrons do NOT follow classical trajectories along the lobes.
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'advanced-crystal-lattice-explorer' && (() => {
                    const m = calculateCrystalLatticeMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.latticeName}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            CN = {m.coordinationNumber} • APF = {m.atomicPackingFactorPct}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Atoms per Unit Cell (Conv / Prim)</span>
                            <strong className="text-emerald-300">{m.atomsPerConventionalUnitCell} Conventional ({m.atomsPerPrimitiveCell} Primitive)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Idealized Lattice Dimensions (r = {m.atomicRadiusPm} pm)</span>
                            <strong className="text-sky-300">a = {m.latticeParameterAPm} pm ({m.aToRFormula}) • V = {m.unitCellVolumeNm3} nm³</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Boundary Atom-Sharing Accounting</span>
                            <strong className="text-amber-300">{m.atomSharingBreakdown}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Idealized Hard-Sphere Model: Assumes touching spheres of radius r. Real metals ({m.exampleElements}) have element-specific lattice constants and physical properties.
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'molecular-polarity-explorer' && (() => {
                    const m = calculateMolecularPolarityMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            {m.moleculeName} • {m.vseprGeometry} ({m.actualBondAngleDeg}°)
                          </span>
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${m.isPolarMolecule ? 'text-amber-300 bg-amber-500/15' : 'text-emerald-300 bg-emerald-500/15'}`}>
                            {m.overallPolarityClassification}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Pauling Electronegativity & Δχ</span>
                            <strong className="text-sky-300">{m.centralAtomSymbol} ({m.centralElectronegativity}) vs {m.terminalAtomSymbol} ({m.terminalElectronegativity}) ➔ Δχ = {m.electronegativityDifference}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Partial Charges & Net Dipole μ_net</span>
                            <strong className="text-amber-300">{m.centralPartialCharge}, {m.terminalPartialCharge} • μ_net = {m.netDipoleMomentDebye} D</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">3D Vector Superposition Rule</span>
                            <strong className="text-emerald-300">{m.scientificExplanation}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Dipole Arrow Legend: Cyan crossed arrows (+—▸) show individual bond dipoles pointing from δ⁺ to δ⁻; the Gold arrow shows resultant net dipole μ_net = Σ μ_i. Partial charges (δ⁺/δ⁻) are fractional covalent charge shifts, not full ionic charges.
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'intermolecular-forces-explorer' && (() => {
                    const m = calculateIntermolecularForcesMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.systemTitle}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            {m.attractionStatus} • V = {m.potentialEnergyKjMol} kJ/mol
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Separation r & Orientation θ</span>
                            <strong className="text-sky-300">r = {m.separationAngstrom} Å (r_eq = {m.equilibriumSeparationAngstrom} Å) • θ = {m.relativeOrientationDeg}°</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Normal Boiling Point & Polarizability α</span>
                            <strong className="text-amber-300">BP = {m.normalBoilingPointC}°C ({m.roomTempPhase}) • α = {m.polarizabilityVolumeAngstrom3} Å³</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Physical Interpretation & Universal Dispersion Rule</span>
                            <strong className="text-emerald-300">{m.orientationDependenceNote}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.alwaysPresentLondonNote} Dashed force overlays indicate non-covalent intermolecular attractions (not permanent covalent bonds).
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'electrochemical-cell-simulator' && (() => {
                    const m = calculateElectrochemicalCellMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {m.cellTitle} • {m.cellNotation}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            E°_cell = +{m.standardCellPotentialV.toFixed(2)} V • E_Nernst = +{m.liveNernstPotentialV.toFixed(3)} V
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Anode Oxidation (− Terminal, E° = {m.anodeStandardPotentialV.toFixed(2)} V)</span>
                            <strong className="text-sky-300">{m.anodeHalfReaction} ([{m.anodeIon}] = {m.anodeConcentrationM} M)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Cathode Reduction (+ Terminal, E° = +{m.cathodeStandardPotentialV.toFixed(2)} V)</span>
                            <strong className="text-amber-300">{m.cathodeHalfReaction} ([{m.cathodeIon}] = {m.cathodeConcentrationM} M)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Overall Spontaneous Redox Reaction (ΔG = {m.gibbsFreeEnergyKjMol} kJ/mol)</span>
                            <strong className="text-emerald-300">{m.overallRedoxReaction}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.electronFlowDirection}. {m.saltBridgeIonMigration} (Electrons NEVER flow through the salt bridge).
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'electrolysis-explorer' && (() => {
                    const m = calculateElectrolysisMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.experimentTitle}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            Q = It = {m.totalChargeCoulombs} C ({m.molesOfElectrons} mol e⁻)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Negative Cathode (− Reduction, z = {m.cathodeElectronStoichiometryZ})</span>
                            <strong className="text-emerald-300">
                              {m.cathodeHalfReaction} ➔ m = {m.cathodeTheoreticalMassG} g {m.cathodeGasVolumeMlStp > 0 ? `(${m.cathodeGasVolumeMlStp} mL STP)` : `(${m.cathodeProductName})`}
                            </strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Positive Anode (+ Oxidation, z = {m.anodeElectronStoichiometryZ})</span>
                            <strong className="text-rose-300">
                              {m.anodeHalfReaction} ➔ m = {m.anodeTheoreticalMassG} g ({m.anodeGasVolumeMlStp} mL STP)
                            </strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Overall Nonspontaneous Reaction & Faraday Calculator (m = MIt / zF)</span>
                            <strong className="text-sky-300">{m.overallReaction} • Electrolyte: {m.electrolyteDescription}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.scientificNote} Theoretical yields assume 100% Faraday current efficiency (F = 96,485 C/mol).
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Live Scientific Readout, Equations & Calculators for Chemistry Batch 2 (Models 76–82) */}
              {isChemistryBatch2Model(modelSpec.functionalType, modelSpec.id) && (
                <div
                  data-testid="chemistry-batch2-readout-panel"
                  className="pt-3 border-t border-slate-100 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Chemistry Batch 2 Quantitative Solver</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      Real-Time Kinetics & Equilibrium
                    </span>
                  </div>

                  {modelSpec.functionalType === 'chemical-kinetics-simulator' && (() => {
                    const m = calculateChemicalKineticsMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.reactionTitle}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            k = {m.rateConstantK} {m.rateConstantUnits} • t₁/₂ = {m.halfLifeSec} s
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Rate Law & Integrated Form</span>
                            <strong className="text-sky-300">{m.rateLawExpression} • {m.integratedRateLawExpression}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Concentrations at t = {m.elapsedScientificTimeSec} s</span>
                            <strong className="text-emerald-300">[A]_t = {m.currentReactantConcM} M • [P]_t = {m.currentProductConcM} M</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Instantaneous Rate r(t) & Half-Life</span>
                            <strong className="text-amber-300">r(t) = {m.currentReactionRateMS} M/s • {m.halfLifeFormula}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Arrhenius Parameters (T = {m.temperatureK} K)</span>
                            <strong className="text-rose-300">E_a = {m.activeActivationEnergyKjMol} kJ/mol ({m.catalystActive ? 'Catalysed' : 'Uncatalysed'})</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.orderOriginStatement} {m.microMacroDisclaimer}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'chemical-equilibrium-explorer' && (() => {
                    const m = calculateChemicalEquilibriumMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {m.balancedEquation}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            Q_c = {m.reactionQuotientQc} vs K_c = {m.equilibriumConstantKc}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Equilibrium Expression & K_p</span>
                            <strong className="text-sky-300">{m.kcExpression} • K_p = {m.equilibriumConstantKp}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Thermodynamic Shift Direction</span>
                            <strong className="text-amber-300">{m.equilibriumDirection}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Mass-Balance Equilibrium Concentrations & Dynamic Rates</span>
                            <strong className="text-emerald-300">
                              [A]_eq = {m.equilibriumReactantAM} M, [C]_eq = {m.equilibriumProductCM} M • r_fwd = r_rev = {m.forwardRateAtEq} M/s (P_tot = {m.totalPressureAtm} atm)
                            </strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.leChatelierExplanation} {m.catalystExplanation}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'reaction-energy-profile-explorer' && (() => {
                    const m = calculateReactionEnergyProfileMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            {m.profileTitle}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            ΔH = {m.enthalpyChangeDeltaHKjMol > 0 ? `+${m.enthalpyChangeDeltaHKjMol}` : m.enthalpyChangeDeltaHKjMol} kJ/mol ({m.thermodynamicClassification.split(' ')[0]})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Forward & Reverse Activation Barriers</span>
                            <strong className="text-amber-300">E_a(fwd) = {m.forwardActivationEnergyKjMol} kJ/mol • E_a(rev) = {m.reverseActivationEnergyKjMol} kJ/mol</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">State Enthalpies (Illustrative kJ/mol)</span>
                            <strong className="text-sky-300">H_R = {m.reactantEnergyKjMol} • H_TS‡ = {m.highestPeakEnergyKjMol} • H_P = {m.productEnergyKjMol}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Active Coordinate Position (ξ = {m.reactionCoordinateProgress})</span>
                            <strong className="text-emerald-300">H(ξ) = {m.currentCoordinateEnergyKjMol} kJ/mol — {m.currentRegionLabel}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.forwardVsReverseComparison} {m.illustrativeEnergyNote}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'catalysis-explorer' && (() => {
                    const m = calculateCatalysisMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {m.catalystTitle}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                            ΔE_a = −{m.activationEnergyReductionKjMol} kJ/mol ({m.arrheniusRateEnhancementFactor.toExponential(2)}× Rate)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Uncatalysed vs Catalysed Barrier</span>
                            <strong className="text-sky-300">E_a(uncat) = {m.uncatalysedEaKjMol} kJ/mol ➔ E_a(cat) = {m.catalysedEaKjMol} kJ/mol</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Catalyst Identity & Overall ΔH°</span>
                            <strong className="text-emerald-300">{m.catalystIdentity} (ΔH° = {m.overallDeltaHKjMol} kJ/mol)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">{m.reactionStepTitle}</span>
                            <strong className="text-amber-300">{m.reactionStepDescription}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.equilibriumConstantUnchangedNote}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'acid-base-titration-laboratory' && (() => {
                    const m = calculateTitrationMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            {m.titrationTitle}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            pH = {m.currentPh.toFixed(2)} at V_t = {m.titrantVolumeAddedMl} mL (V_eq = {m.equivalenceVolumeMl} mL)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Equivalence & Half-Equivalence Volumes</span>
                            <strong className="text-amber-300">V_eq = {m.equivalenceVolumeMl} mL (pH_eq = {m.equivalencePointPh}) • ½V_eq = {m.halfEquivalenceVolumeMl} mL</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Indicator ({m.indicatorName}: {m.indicatorTransitionRange})</span>
                            <strong className="text-sky-300">{m.indicatorColorDescription}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Active Titration Region & Chemical Calculation Method</span>
                            <strong className="text-emerald-300">{m.titrationRegionLabel} — {m.activeCalculationMethod}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.pKaOrPKbNote} {m.indicatorSuitabilityNote}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'solubility-precipitation-explorer' && (() => {
                    const m = calculateSolubilityPrecipitationMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            {m.dissolutionEquation}
                          </span>
                          <span className="text-[11px] font-mono text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded">
                            Q_sp = {m.ionProductQsp.toExponential(2)} vs K_sp = {m.kspValue25C.toExponential(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Thermodynamic Saturation State</span>
                            <strong className="text-emerald-300">{m.saturationStatus}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Crystalline Precipitate Yield</span>
                            <strong className="text-amber-300">{m.precipitateMassMg} mg ({m.precipitateFormedMillimoles} mmol)</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Equilibrium Dissolved Ion Molarities (V = {m.solutionVolumeMl} mL)</span>
                            <strong className="text-sky-300">
                              [{m.cationFormula}]_eq = {m.equilibriumCationConcM.toExponential(2)} M • [{m.anionFormula}]_eq = {m.equilibriumAnionConcM.toExponential(2)} M ({m.kspExpression})
                            </strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.commonIonEffectExplanation} {m.kineticNucleationDisclaimer}
                        </p>
                      </div>
                    );
                  })()}

                  {modelSpec.functionalType === 'buffer-solution-simulator' && (() => {
                    const m = calculateBufferSolutionMetrics({ ...parameters, ...conditions });
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            {m.bufferTitle} (pK_a = {m.pKaValue})
                          </span>
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${m.bufferCapacityExceeded ? 'text-rose-300 bg-rose-500/15' : 'text-emerald-300 bg-emerald-500/15'}`}>
                            pH: {m.initialPh.toFixed(2)} ➔ {m.finalPh.toFixed(2)} (ΔpH = {m.deltaPh >= 0 ? `+${m.deltaPh.toFixed(2)}` : m.deltaPh.toFixed(2)})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Remaining Buffer Composition ({m.solutionVolumeMl} mL)</span>
                            <strong className="text-sky-300">
                              {m.weakComponentFormula}: {m.remainingWeakMmol} mmol ({m.remainingWeakConcM} M) • {m.conjugatePartnerFormula}: {m.remainingConjugateMmol} mmol ({m.remainingConjugateConcM} M)
                            </strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">Solver & Useful Buffer Window</span>
                            <strong className="text-amber-300">{m.usefulBufferRangePh} • Ratio = {m.conjugateRatioBaseOverAcid}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg col-span-2">
                            <span className="text-slate-400 block text-[10px]">Buffer Capacity Comparison (Same Acid/Base Shock)</span>
                            <strong className="text-emerald-300">{m.capacityComparisonSummary}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {m.neutralizationMechanismText} ({m.calculationMethodLabel})
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Universal Live Quantitative Readout & Scientific Concept Specification Panel */}
              {(() => {
                const sciSpec =
                  modelSpec.scientificSpecification ||
                  buildScientificConceptSpecification(modelSpec.prompt || modelSpec.title, modelSpec);
                const hasCustomBatchReadout =
                  isAdvancedPhysicsBatch3Model(modelSpec.functionalType, modelSpec.id) ||
                  isAdvancedPhysicsBatch4Model(modelSpec.functionalType, modelSpec.id) ||
                  isChemistryBatch1Model(modelSpec.functionalType, modelSpec.id) ||
                  isChemistryBatch2Model(modelSpec.functionalType, modelSpec.id);

                const isDoublePendulum = modelSpec.id.includes('double-pendulum');
                const isAtwood = modelSpec.id.includes('atwood');
                const isSolenoid = modelSpec.id.includes('solenoid');
                const isCrt = modelSpec.id.includes('crt') || modelSpec.id.includes('cathode-ray');
                const isCyclotron = modelSpec.id.includes('cyclotron');

                return (
                  <div
                    data-testid="universal-scientific-spec-panel"
                    className="pt-3 border-t border-slate-100 space-y-3"
                  >
                    {!hasCustomBatchReadout && (
                      <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2.5 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-sky-400" />
                            <span>Live Quantitative Outputs & System State</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                            {sciSpec.scientificDomain} • {modelSpec.simulationModel === 'illustrative' ? 'Illustrative' : 'Coupled Solver'}
                          </span>
                        </div>

                        {isDoublePendulum ? (() => {
                          const theta0 = Number(parameters.initialAngle ?? 65);
                          const rodRatio = Number(parameters.rodRatio ?? 1.0);
                          const massRatio = Number(parameters.massRatio ?? 1.0);
                          const g = Number(parameters.gravity ?? 9.81);
                          const L1 = 1.65;
                          const L2 = 1.55 * rodRatio;
                          const omega1 = Math.sqrt(g / L1);
                          const omega2 = Math.sqrt((g / L2) * (1 + 0.45 * massRatio));
                          const period1 = (2 * Math.PI) / omega1;
                          const energyJ = (1 + massRatio) * g * L1 * (1 - Math.cos((theta0 * Math.PI) / 180));
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Primary Mode ω₁ / Period T₁</span>
                                <strong className="text-sky-300">{omega1.toFixed(2)} rad/s • {period1.toFixed(2)} s</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Coupled Mode ω₂ (L₂/L₁ = {rodRatio})</span>
                                <strong className="text-amber-300">{omega2.toFixed(2)} rad/s (m₂/m₁ = {massRatio})</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Total Energy E & Regime</span>
                                <strong className="text-emerald-300">
                                  {energyJ.toFixed(1)} J ({theta0 > 45 ? 'Chaotic Non-Linear' : 'Quasi-Periodic'})
                                </strong>
                              </div>
                            </div>
                          );
                        })() : isAtwood ? (() => {
                          const m1 = Number(parameters.mass1 ?? 4.0);
                          const m2 = Number(parameters.mass2 ?? 2.5);
                          const g = Number(parameters.gravity ?? 9.81);
                          const accel = ((m1 - m2) / (m1 + m2)) * g;
                          const tension = ((2 * m1 * m2) / (m1 + m2)) * g;
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Net Acceleration a</span>
                                <strong className="text-sky-300">{accel.toFixed(2)} m/s²</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Cord Tension T</span>
                                <strong className="text-amber-300">{tension.toFixed(2)} N</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Motion State</span>
                                <strong className="text-emerald-300">
                                  {Math.abs(m1 - m2) < 0.05 ? 'Static Equilibrium (a = 0)' : m1 > m2 ? 'm₁ Descending' : 'm₂ Descending'}
                                </strong>
                              </div>
                            </div>
                          );
                        })() : isSolenoid ? (() => {
                          const I = Number(parameters.current ?? 3.5);
                          const N = Number(parameters.turnDensity ?? 500);
                          const muR = Number(parameters.corePermeability ?? 4.0);
                          const B_mT = 4 * Math.PI * 1e-4 * muR * N * I;
                          return (
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Core Flux Density B = μ₀·μ_r·n·I</span>
                                <strong className="text-sky-300">{B_mT.toFixed(2)} mT</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Ampere-Turns (n·I)</span>
                                <strong className="text-emerald-300">{(N * I).toFixed(0)} A·turns/m (μ_r = {muR})</strong>
                              </div>
                            </div>
                          );
                        })() : isCrt ? (() => {
                          const Vacc = Number(parameters.acceleratingVoltage ?? 2.5);
                          const Vplate = Number(parameters.plateVoltage ?? 150);
                          const B = Number(parameters.magneticField ?? 1.5);
                          const vElectron = Math.sqrt((2 * 1.602e-19 * Vacc * 1000) / 9.109e-31) / 1e7;
                          const deflMm = (Vplate / (Vacc * 100)) * 8.5;
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Beam Velocity v_e</span>
                                <strong className="text-sky-300">{vElectron.toFixed(2)} × 10⁷ m/s</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Screen Deflection Δy</span>
                                <strong className="text-amber-300">{deflMm >= 0 ? `+${deflMm.toFixed(1)}` : deflMm.toFixed(1)} mm</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Helmholtz Field B</span>
                                <strong className="text-emerald-300">{B.toFixed(2)} mT</strong>
                              </div>
                            </div>
                          );
                        })() : isCyclotron ? (() => {
                          const B = Number(parameters.magneticField ?? 1.5);
                          const Vrf = Number(parameters.rfVoltage ?? 50);
                          const fcMhz = (1.602e-19 * B) / (2 * Math.PI * 1.6726e-27 * 1e6);
                          const KmaxMev = ((1.602e-19 * B * 0.45) ** 2) / (2 * 1.6726e-27 * 1.602e-13);
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Cyclotron Frequency f_c</span>
                                <strong className="text-sky-300">{fcMhz.toFixed(2)} MHz</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Max Beam Energy K_max</span>
                                <strong className="text-emerald-300">{KmaxMev.toFixed(2)} MeV</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Gap Gain per Turn (2·q·V_rf)</span>
                                <strong className="text-amber-300">{(2 * Vrf).toFixed(0)} keV/turn</strong>
                              </div>
                            </div>
                          );
                        })() : modelSpec.id.includes('hydraulic-press') ? (() => {
                          const F1 = Number(parameters.inputForceN ?? 200);
                          const ratio = Number(parameters.areaRatio ?? 10);
                          const strokePct = Number(parameters.plungerStrokePct ?? 50);
                          const F2 = F1 * ratio;
                          const pressureKpa = (F1 / 0.002) / 1000;
                          const d1Cm = (strokePct / 100) * 12.0;
                          const d2Cm = d1Cm / ratio;
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Multiplied Output Force F₂</span>
                                <strong className="text-emerald-300">{F2.toFixed(0)} N ({ratio}× MA)</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Hydrostatic Pressure P</span>
                                <strong className="text-sky-300">{pressureKpa.toFixed(1)} kPa</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Stroke Displacement d₁ ➔ d₂</span>
                                <strong className="text-amber-300">{d1Cm.toFixed(1)} cm ➔ {d2Cm.toFixed(2)} cm</strong>
                              </div>
                            </div>
                          );
                        })() : modelSpec.id.includes('kidney-nephron') ? (() => {
                          const Pgc = Number(parameters.glomerularPressureMmHg ?? 55);
                          const osm = Number(parameters.medullaryGradientMOsM ?? 900);
                          const adh = Number(parameters.adhHormoneLevelPct ?? 60);
                          const nfp = Math.max(0, Pgc - 15 - 30);
                          const gfr = nfp * 12.5;
                          const urineOsm = Math.round(100 + (osm - 100) * (adh / 100));
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Net Filtration Pressure NFP</span>
                                <strong className="text-sky-300">{nfp.toFixed(1)} mmHg</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Glomerular Filtration GFR</span>
                                <strong className="text-emerald-300">{gfr.toFixed(1)} mL/min</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Final Urine Osmolarity</span>
                                <strong className="text-amber-300">{urineOsm} mOsm/L (ADH {adh}%)</strong>
                              </div>
                            </div>
                          );
                        })() : modelSpec.id.includes('jet-engine') ? (() => {
                          const thr = Number(parameters.throttleRpmPct ?? 75);
                          const opr = Number(parameters.pressureRatioOpr ?? 32);
                          const bpr = Number(parameters.bypassRatioBpr ?? 8.0);
                          const etaBrayton = (1 - Math.pow(opr, -0.2857)) * 100;
                          const netThrustKn = (thr / 100) * (120 + bpr * 22) * (opr / 30);
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Net Turbofan Thrust F</span>
                                <strong className="text-emerald-300">{netThrustKn.toFixed(1)} kN</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Brayton Thermal Efficiency η</span>
                                <strong className="text-sky-300">{etaBrayton.toFixed(1)}% (OPR {opr}:1)</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Bypass Mass Ratio</span>
                                <strong className="text-amber-300">{bpr.toFixed(1)}:1 • Throttle {thr}%</strong>
                              </div>
                            </div>
                          );
                        })() : modelSpec.id.includes('robotic-arm') ? (() => {
                          const az = Number(parameters.baseAzimuthDeg ?? 0);
                          const sh = Number(parameters.shoulderPitchDeg ?? 18);
                          const el = Number(parameters.elbowPitchDeg ?? 25);
                          const grip = Number(parameters.gripperApertureMm ?? 45);
                          const t1 = (az * Math.PI) / 180;
                          const t2 = (sh * Math.PI) / 180;
                          const t3 = (el * Math.PI) / 180;
                          const reachR = 1.85 * Math.sin(t2) + 1.6 * Math.sin(t2 + t3 + 0.85);
                          const eeX = -0.8 + reachR * Math.cos(t1);
                          const eeY = -1.0 + 1.85 * Math.cos(t2) + 1.6 * Math.cos(t2 + t3 + 0.85);
                          const eeZ = -reachR * Math.sin(t1);
                          const torqueNm = Math.abs(45 * Math.sin(t2) + 28 * Math.sin(t2 + t3 + 0.85)) + 12;
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">End-Effector Coordinates</span>
                                <strong className="text-sky-300">
                                  ({eeX.toFixed(2)}, {eeY.toFixed(2)}, {eeZ.toFixed(2)}) m
                                </strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Shoulder Holding Torque τ₂</span>
                                <strong className="text-amber-300">{torqueNm.toFixed(1)} N·m</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px]">Gripper Jaw Aperture</span>
                                <strong className="text-emerald-300">{grip} mm ({grip < 25 ? 'Clamped' : 'Open'})</strong>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            {Object.values(modelSpec.parameters).slice(0, 4).map((param) => {
                              const val = Number(parameters[param.id] ?? param.defaultValue ?? 1);
                              const pct = Math.round(((val - param.min) / Math.max(0.0001, param.max - param.min)) * 100);
                              return (
                                <div key={param.id} className="bg-slate-800/80 p-2 rounded-lg">
                                  <span className="text-slate-400 block text-[10px]">{param.name}</span>
                                  <strong className="text-sky-300">
                                    {val} {param.unit} ({pct}% range)
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 8: Research Transparency & Model Validation Panel */}
                    <div
                      data-testid="research-transparency-panel"
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          <span>Research & Scientific Specification</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            data-testid="research-status-badge"
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              (modelSpec.researchRecord?.status || sciSpec.researchStatus) === 'web-researched'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {(modelSpec.researchRecord?.status || sciSpec.researchStatus) === 'web-researched'
                              ? `Web-researched (${(modelSpec.researchRecord?.sources || sciSpec.researchSources || []).length} ref)`
                              : 'Knowledge-based'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                            {sciSpec.scientificDomain}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 leading-relaxed">
                        <p>
                          <strong className="text-slate-800">Requested Concept:</strong>{' '}
                          <span className="font-medium text-slate-900">{modelSpec.prompt || modelSpec.title}</span>
                          {sciSpec.modelCategory ? ` (${sciSpec.modelCategory})` : ''}
                        </p>
                        <p>
                          <strong className="text-slate-800">Structure & Interpretation:</strong>{' '}
                          {sciSpec.chosenInterpretation}
                        </p>
                        {sciSpec.governingBehavior && (
                          <p>
                            <strong className="text-slate-800">Working Mechanism:</strong>{' '}
                            {sciSpec.governingBehavior}
                          </p>
                        )}
                      </div>

                      {sciSpec.governingEquations && sciSpec.governingEquations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {sciSpec.governingEquations.slice(0, 3).map((eq, idx) => (
                            <code
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-900 text-sky-300 text-[11px] font-mono"
                            >
                              {eq}
                            </code>
                          ))}
                        </div>
                      )}

                      {/* Retrieved Scientific Evidence & Verifiable Web Sources */}
                      {(() => {
                        const sources = modelSpec.researchRecord?.sources || sciSpec.researchSources || [];
                        const facts = modelSpec.researchRecord?.retrievedFacts || sciSpec.retrievedFacts || [];
                        const checks = modelSpec.validationReport?.checks || [];
                        return (
                          <div className="space-y-2 pt-1 border-t border-slate-200/70">
                            {facts.length > 0 && (
                              <div className="text-[11px] text-slate-600 space-y-1">
                                <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
                                  Extracted Scientific Findings:
                                </span>
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {facts.slice(0, 2).map((fact, idx) => (
                                    <li key={idx} className="leading-snug">
                                      {fact}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sources.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
                                  Verified Research Sources:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {sources.map((src, idx) => (
                                    <a
                                      key={idx}
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-sky-400 text-[10px] font-medium text-sky-700 hover:text-sky-900 transition-colors"
                                      title={src.snippet}
                                    >
                                      <span>{src.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {checks.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {checks.map((chk) => (
                                  <span
                                    key={chk.id}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                                      chk.passed
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                                    }`}
                                    title={chk.detail}
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{chk.label}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {sciSpec.limitations && (
                        <p className="text-[10px] text-slate-500 leading-snug pt-0.5">
                          <strong className="text-slate-700">Assumptions & Scope:</strong>{' '}
                          {Array.isArray(sciSpec.limitations) ? sciSpec.limitations[0] : sciSpec.limitations}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* =========================================================================
                3D VIEWER OPTIONS & DISPLAY SETTINGS (Right column, below Parameter Panel)
                ========================================================================= */}
            <div id="ai-viewer-options-deck" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 transition-all">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3D Viewer Options & Display Settings
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Display Toggles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Hide / Show Labels Toggle */}
                <button
                  type="button"
                  onClick={() => setShowLabels(!showLabels)}
                  data-testid="toggle-labels-button"
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    showLabels
                      ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={showLabels ? 'Hide Labels' : 'Show Labels'}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{showLabels ? 'Hide Labels' : 'Show Labels'}</span>
                </button>

                {/* Lab Grid Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    showGrid
                      ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={showGrid ? 'Hide Lab Grid' : 'Show Lab Grid'}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
                </button>

                {/* Axes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAxes(!showAxes)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    showAxes
                      ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={showAxes ? 'Hide Coordinate System' : 'Show Coordinate System'}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{showAxes ? 'Hide Axes' : 'Show Axes'}</span>
                </button>

                {/* Exploded View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsExplodedView(!isExplodedView)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isExplodedView
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={isExplodedView ? 'Collapse Exploded View' : 'Exploded View'}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{isExplodedView ? 'Exploded: ON' : 'Exploded View'}</span>
                </button>

                {/* Internal View Toggle */}
                {hasInternalViewCondition && (
                  <button
                    type="button"
                    onClick={() => handleToggleInternalView(!isInternalViewActive)}
                    data-testid="toggle-internal-view-button"
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isInternalViewActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title={isInternalViewActive ? 'Switch Internal View OFF' : 'Switch Internal View ON'}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isInternalViewActive ? 'Internal: ON' : 'Internal View'}</span>
                  </button>
                )}

                {/* Pause / Resume Simulation Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="toggle-simulation-play-button"
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isPlaying
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                  }`}
                  title={isPlaying ? 'Pause real-time 3D physics animation' : 'Resume real-time 3D physics animation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause Sim' : 'Resume Sim'}</span>
                </button>

                {/* Reset Camera Button */}
                <button
                  type="button"
                  onClick={handleResetCameraOnly}
                  data-testid="reset-camera-button"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  title="Reset 3D camera position, rotation, and zoom to default overview"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Camera</span>
                </button>

                {/* Reset Apparatus & Parameters Button */}
                <button
                  type="button"
                  onClick={handleFullViewerReset}
                  data-testid="reset-apparatus-button"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  title="Reset apparatus parameters, conditions, transforms, and camera to initial defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                  <span>Reset Apparatus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 6: MODEL-AWARE AI CHATBOX UNDERNEATH THE WORKSPACE
          Full width, synchronized with active model parameters & components!
          ========================================================================= */}
      <div className="w-full">
        <ModelAwareChatbot
          context={{
            modelId: modelSpec.id,
            title: modelSpec.title,
            subject: modelSpec.concept || 'Science / Physics / Biology / Chemistry',
            concept: modelSpec.concept,
            description: modelSpec.description,
            parameters: parameters,
            components: modelSpec.parts.map((p) => ({
              id: p.id,
              name: getComponentDisplayName(p),
              whatIsIt: p.whatIsIt || p.description,
              whatDoesItDo: p.whatDoesItDo || p.description,
              description: p.description,
              realLifeExample: p.realLifeExample,
            })),
            selectedComponent: inspectedPart
              ? {
                  id: inspectedPart.id,
                  name: getComponentDisplayName(inspectedPart),
                  whatIsIt: inspectedPart.whatIsIt || inspectedPart.description,
                  whatDoesItDo: inspectedPart.whatDoesItDo || inspectedPart.description,
                  description: inspectedPart.description,
                  realLifeExample: inspectedPart.realLifeExample,
                }
              : null,
            recentChange: lastParamWhy
              ? {
                  parameter: lastParamWhy.title,
                  oldValue: '',
                  newValue: '',
                  why: lastParamWhy.why,
                }
              : null,
          }}
        />
      </div>

      {/* Presentation Export Modal for 3D Scientific Model */}
      <PresentationExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={presentationData}
        defaultFilename={modelSpec.title}
      />
    </div>
  );
};
