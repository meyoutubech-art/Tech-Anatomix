import React, { useState, useMemo, useEffect } from 'react';
import {
  getAllArenaMissions,
  ScienceGameMission,
  evaluateExperimentCompletion,
} from '../gaming/scienceMissionsData';
import {
  DiscoveredModelGameCapability,
  evaluateModelSimulationState,
  findCuratedSpecById,
} from '../gaming/modelGameAdapter';
import {
  PlayerArenaProfile,
  loadArenaProfile,
  resetArenaProfile,
  recordRecentlyPlayed,
  recordMissionCompletion,
  calculateLevelFromXp,
  ARENA_ACHIEVEMENTS,
  AchievementBadge,
  HybridGameMode,
  GameSuitabilityTier,
} from '../gaming/gameProgressStore';
import { ModelLaunchTarget } from '../data/modelsDirectoryRegistry';
import { PageRoute } from '../components/layout/Navbar';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import { PendulumScene } from '../components/physics/PendulumScene';
import { ProjectileScene } from '../components/physics/ProjectileScene';
import { CircuitScene } from '../components/physics/CircuitScene';
import { ChemistryLabScene } from '../components/chemistry/ChemistryLabScene';
import { CellScene } from '../components/biology/CellScene';
import { HeartScene } from '../components/biology/HeartScene';
import { DnaScene } from '../components/biology/DnaScene';
import { calculatePendulumMetrics } from '../simulations/physics/pendulumEngine';
import { calculateProjectileMotion } from '../simulations/physics/projectileEngine';
import { calculateCircuitState } from '../simulations/physics/circuitEngine';
import { REAGENTS } from '../data/reactionsData';
import { soundEngine } from '../utils/soundEngine';
import {
  Play,
  RotateCcw,
  Trophy,
  Award,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Compass,
  FlaskConical,
  Atom,
  Dna,
  Layers,
  Zap,
  Target,
  BookOpen,
  ExternalLink,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';

export interface GamingArenaPageProps {
  onNavigate: (route: PageRoute) => void;
  onLaunchModelInLab: (target: ModelLaunchTarget) => void;
  initialMissionId?: string;
}

type ArenaScreenMode = 'lobby' | 'briefing' | 'gameplay' | 'results';
type ActiveStageIndex = 0 | 1 | 2;

export const GamingArenaPage: React.FC<GamingArenaPageProps> = ({
  onLaunchModelInLab,
  initialMissionId,
}) => {
  const { capabilities, missions, capabilityByModelId } = useMemo(
    () => getAllArenaMissions(),
    []
  );

  // Player persistence profile
  const [profile, setProfile] = useState<PlayerArenaProfile>(() => loadArenaProfile());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(
    () => soundEngine.getSettings().enabled
  );

  // Navigation & filter state
  const [screenMode, setScreenMode] = useState<ArenaScreenMode>('lobby');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedGameMode, setSelectedGameMode] = useState<string>('all');
  const [selectedSuitability, setSelectedSuitability] = useState<string>('all');
  const [onlyMy29Models, setOnlyMy29Models] = useState<boolean>(false);
  const [showBadgesPanel, setShowBadgesPanel] = useState<boolean>(false);

  // Active Mission & Gameplay State
  const [activeMission, setActiveMission] = useState<ScienceGameMission>(() => {
    if (initialMissionId) {
      const found = missions.find((m) => m.id === initialMissionId);
      if (found) return found;
    }
    return missions[0];
  });
  const [activeModelIdOverride, setActiveModelIdOverride] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<ActiveStageIndex>(0);
  const [viewportResetKey, setViewportResetKey] = useState<number>(0);

  // Simulation Parameter & Selection State for Active Mission
  const [simParameters, setSimParameters] = useState<Record<string, number>>({});
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [chemistryReagentIds, setChemistryReagentIds] = useState<string[]>([
    'pb_no3_2',
    'ki',
  ]);

  // Stage 1: Prediction state
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [predictionSubmitted, setPredictionSubmitted] = useState<boolean>(false);
  const [predictionCorrect, setPredictionCorrect] = useState<boolean>(false);

  // Stage 2: Experiment verification state
  const [experimentVerified, setExperimentVerified] = useState<boolean>(false);
  const [experimentFeedback, setExperimentFeedback] = useState<string | null>(null);
  const [experimentPassedLastCheck, setExperimentPassedLastCheck] = useState<boolean>(false);

  // Stage 3: Puzzle state
  const [selectedPuzzleOptionId, setSelectedPuzzleOptionId] = useState<string | null>(null);
  const [puzzleSubmitted, setPuzzleSubmitted] = useState<boolean>(false);
  const [puzzleCorrect, setPuzzleCorrect] = useState<boolean>(false);

  // Hint & Scoring state
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [revealedStageHints, setRevealedStageHints] = useState<Record<number, boolean>>({});
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [completionSummary, setCompletionSummary] = useState<{
    xpGained: number;
    starsEarned: 1 | 2 | 3;
    newlyUnlockedBadges: AchievementBadge[];
    leveledUp: boolean;
  } | null>(null);

  const effectiveModelId = activeModelIdOverride || activeMission.modelId;
  const activeCapability: DiscoveredModelGameCapability | undefined =
    capabilityByModelId.get(effectiveModelId) ||
    capabilityByModelId.get(activeMission.modelId);

  // Initialize default model parameters whenever a mission or model is loaded
  const initializeMissionSimulationState = (
    mission: ScienceGameMission,
    overrideModelId?: string | null
  ) => {
    const targetId = overrideModelId || mission.modelId;
    const cap = capabilityByModelId.get(targetId);
    const defaults: Record<string, number> = {};

    if (cap) {
      cap.adjustableParameters.forEach((p) => {
        defaults[p.id] = p.defaultValue;
      });
    }

    // For simple-pendulum, set default length to 1.6 m so the player actively tunes it to 1.0 m for the 2.0 s target
    if (targetId === 'simple-pendulum') {
      defaults.length = 1.65;
      defaults.gravity = 9.81;
      defaults.mass = 1.0;
      defaults.initialAngle = 25;
    } else if (targetId === 'projectile-motion') {
      defaults.velocity = 18;
      defaults.angle = 35;
      defaults.gravity = 9.81;
      defaults.mass = 2.0;
    } else if (targetId === 'electric-circuit') {
      defaults.voltage = 6.0;
      defaults.resistance = 12.0;
      defaults.isClosed = 1;
    }

    setSimParameters(defaults);
    setSelectedPartId(null);
    setChemistryReagentIds([]);
    setViewportResetKey((k) => k + 1);
  };

  const handleSelectMissionForBriefing = (mission: ScienceGameMission) => {
    soundEngine.stopAllLoops();
    soundEngine.playUiFeedback('button_subtle', `arena_brief_${mission.id}`);
    setActiveMission(mission);
    setActiveModelIdOverride(null);
    setScreenMode('briefing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartGameplay = (mission: ScienceGameMission) => {
    soundEngine.stopAllLoops();
    soundEngine.playUiFeedback('ai_request_accepted', `arena_start_${mission.id}`);
    setActiveMission(mission);
    setActiveModelIdOverride(null);
    initializeMissionSimulationState(mission, null);

    setActiveStage(0);
    setSelectedPredictionId(null);
    setPredictionSubmitted(false);
    setPredictionCorrect(false);
    setExperimentVerified(false);
    setExperimentFeedback(null);
    setExperimentPassedLastCheck(false);
    setSelectedPuzzleOptionId(null);
    setPuzzleSubmitted(false);
    setPuzzleCorrect(false);
    setHintsUsed(0);
    setRevealedStageHints({});
    setSessionScore(0);
    setCompletionSummary(null);

    const updated = recordRecentlyPlayed(profile, {
      missionId: mission.id,
      modelId: mission.modelId,
      title: mission.title,
      category: mission.category,
    });
    setProfile(updated);
    setScreenMode('gameplay');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetCurrentMissionState = () => {
    soundEngine.stopAllLoops();
    soundEngine.playUiFeedback('button_subtle', 'arena_reset_sim');
    initializeMissionSimulationState(activeMission, activeModelIdOverride);
    setExperimentFeedback('Simulation parameters and 3D camera reset to initial baseline.');
  };

  // Stop any active audio loops when leaving gameplay
  useEffect(() => {
    return () => {
      soundEngine.stopAllLoops();
    };
  }, [screenMode, effectiveModelId]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEngine.updateSettings({ enabled: next });
    if (next) {
      soundEngine.playUiFeedback('button_subtle', 'arena_audio_on');
    } else {
      soundEngine.stopAllLoops();
    }
  };

  // Evaluate live simulation telemetry for the active model
  const liveSimState = useMemo(() => {
    return evaluateModelSimulationState(
      effectiveModelId,
      simParameters,
      chemistryReagentIds
    );
  }, [effectiveModelId, simParameters, chemistryReagentIds]);

  // Trigger authentic chemistry reaction sound only when a real reaction occurs in the beaker
  useEffect(() => {
    if (
      screenMode === 'gameplay' &&
      effectiveModelId === 'standalone-chemistry-beaker-lab' &&
      liveSimState.chemistryEvaluation?.isSupported &&
      liveSimState.chemistryEvaluation.reaction
    ) {
      soundEngine.playUiFeedback(
        'reaction_complete',
        `arena_chem_rx_${liveSimState.chemistryEvaluation.reaction.id}`
      );
    }
  }, [
    screenMode,
    effectiveModelId,
    liveSimState.chemistryEvaluation?.reaction?.id,
  ]);

  // Filtered missions for Lobby
  const filteredMissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return missions.filter((m) => {
      const cap = capabilityByModelId.get(m.modelId);
      if (onlyMy29Models && !cap?.isInMy29Models) return false;
      if (selectedDomain !== 'All' && m.category !== selectedDomain) return false;
      if (
        selectedGameMode !== 'all' &&
        m.primaryMode !== selectedGameMode &&
        !m.supportedModes.includes(selectedGameMode as HybridGameMode)
      ) {
        return false;
      }
      if (
        selectedSuitability !== 'all' &&
        cap?.suitabilityTier !== (selectedSuitability as GameSuitabilityTier)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.governingEquation.toLowerCase().includes(q) ||
        m.scientificSummary.toLowerCase().includes(q) ||
        (cap?.title || '').toLowerCase().includes(q)
      );
    });
  }, [
    missions,
    capabilityByModelId,
    searchQuery,
    selectedDomain,
    selectedGameMode,
    selectedSuitability,
    onlyMy29Models,
  ]);

  const featuredDedicatedMissions = useMemo(
    () => filteredMissions.filter((m) => m.isFeaturedDedicatedGame),
    [filteredMissions]
  );

  // Stage 1 Handler: Submit Prediction
  const handleSubmitPrediction = () => {
    if (!selectedPredictionId || predictionSubmitted) return;
    const chosen = activeMission.predictionStage.options.find(
      (o) => o.id === selectedPredictionId
    );
    if (!chosen) return;

    const isRight = chosen.isCorrect;
    setPredictionSubmitted(true);
    setPredictionCorrect(isRight);
    if (isRight) {
      setSessionScore((prev) => prev + 100);
      soundEngine.playUiFeedback('ai_completion', 'arena_pred_correct');
    } else {
      setSessionScore((prev) => prev + 35);
      soundEngine.playUiFeedback('validation_warning', 'arena_pred_wrong');
    }
  };

  // Stage 2 Handler: Verify Live 3D Experiment State
  const handleVerifyExperiment = () => {
    const check = evaluateExperimentCompletion(
      activeMission.experimentStage.targetCondition,
      liveSimState,
      selectedPartId
    );
    setExperimentFeedback(check.feedback);
    setExperimentPassedLastCheck(check.passed);

    if (check.passed && !experimentVerified) {
      setExperimentVerified(true);
      setSessionScore((prev) => prev + 100);
      soundEngine.playUiFeedback('reaction_complete', 'arena_exp_verified');
    } else if (!check.passed) {
      soundEngine.playUiFeedback('validation_warning', 'arena_exp_not_yet');
    }
  };

  // Stage 3 Handler: Submit Science Puzzle & Complete Mission
  const handleSubmitPuzzle = () => {
    if (!selectedPuzzleOptionId || puzzleSubmitted) return;
    const chosen = activeMission.puzzleStage.options.find(
      (o) => o.id === selectedPuzzleOptionId
    );
    if (!chosen) return;

    const isRight = chosen.isCorrect;
    setPuzzleSubmitted(true);
    setPuzzleCorrect(isRight);

    const puzzlePts = isRight ? 100 : 40;
    const hintPenalty = hintsUsed * 25;
    const rawTotal = sessionScore + puzzlePts;
    const finalScore = Math.max(60, Math.min(activeMission.maxScore, rawTotal - hintPenalty));
    setSessionScore(finalScore);

    if (isRight) {
      soundEngine.playUiFeedback('ai_completion', 'arena_puzzle_correct');
    } else {
      soundEngine.playUiFeedback('validation_warning', 'arena_puzzle_wrong');
    }

    const outcome = recordMissionCompletion(profile, {
      missionId: activeMission.id,
      modelId: activeMission.modelId,
      category: activeMission.category,
      score: finalScore,
      maxScore: activeMission.maxScore,
      baseXpReward: activeMission.baseXpReward,
      hintsUsed,
      predictionCorrect,
      experimentVerified,
      puzzleSolved: isRight,
    });

    setProfile(outcome.updatedProfile);
    setCompletionSummary({
      xpGained: outcome.xpGained,
      starsEarned: outcome.starsEarned,
      newlyUnlockedBadges: outcome.newlyUnlockedBadges,
      leveledUp: outcome.leveledUp,
    });
  };

  const handleRevealHint = (stageIdx: number) => {
    if (revealedStageHints[stageIdx]) return;
    setRevealedStageHints((prev) => ({ ...prev, [stageIdx]: true }));
    setHintsUsed((prev) => prev + 1);
    soundEngine.playUiFeedback('button_subtle', `arena_hint_${stageIdx}`);
  };

  const levelInfo = useMemo(() => calculateLevelFromXp(profile.xp), [profile.xp]);
  const completedMissionsCount = Object.keys(profile.completedMissions).length;
  const predictionAccuracy =
    profile.predictionsAttempted > 0
      ? Math.round((profile.predictionsCorrect / profile.predictionsAttempted) * 100)
      : 100;

  // Render the authentic 3D Viewport for the active model
  const renderInteractive3DViewport = () => {
    const rendererKind = activeCapability?.rendererKind || 'dynamic_3d_spec';

    if (rendererKind === 'pendulum_scene') {
      const pParams = {
        length: simParameters.length ?? 1.65,
        gravity: simParameters.gravity ?? 9.81,
        mass: simParameters.mass ?? 1.0,
        initialAngle: simParameters.initialAngle ?? 25,
        damping: false,
      };
      const pResults = calculatePendulumMetrics(pParams);
      return (
        <PendulumScene
          key={`pendulum-${viewportResetKey}`}
          params={pParams}
          results={pResults}
          onUpdateParams={(partial) =>
            setSimParameters((prev) => ({
              ...prev,
              ...(partial.length !== undefined ? { length: partial.length } : {}),
              ...(partial.gravity !== undefined ? { gravity: partial.gravity } : {}),
              ...(partial.mass !== undefined ? { mass: partial.mass } : {}),
              ...(partial.initialAngle !== undefined ? { initialAngle: partial.initialAngle } : {}),
            }))
          }
        />
      );
    }

    if (rendererKind === 'projectile_scene') {
      const projParams = {
        velocity: simParameters.velocity ?? 18,
        angle: simParameters.angle ?? 35,
        gravity: simParameters.gravity ?? 9.81,
        launchHeight: 0,
        airResistance: false,
        windSpeed: 0,
        mass: simParameters.mass ?? 2.0,
      };
      const projResults = calculateProjectileMotion(projParams);
      return (
        <ProjectileScene
          key={`projectile-${viewportResetKey}`}
          params={projParams}
          results={projResults}
          onUpdateParams={(partial) =>
            setSimParameters((prev) => ({
              ...prev,
              ...(partial.velocity !== undefined ? { velocity: partial.velocity } : {}),
              ...(partial.angle !== undefined ? { angle: partial.angle } : {}),
              ...(partial.gravity !== undefined ? { gravity: partial.gravity } : {}),
              ...(partial.mass !== undefined ? { mass: partial.mass } : {}),
            }))
          }
        />
      );
    }

    if (rendererKind === 'circuit_scene') {
      const cParams = {
        voltage: simParameters.voltage ?? 6.0,
        resistance: simParameters.resistance ?? 12.0,
        switchClosed: (simParameters.isClosed ?? 1) >= 0.5,
      };
      const cResults = calculateCircuitState(cParams);
      return (
        <CircuitScene
          key={`circuit-${viewportResetKey}`}
          params={cParams}
          results={cResults}
          onUpdateParams={(partial) => {
            setSimParameters((prev) => ({
              ...prev,
              ...(partial.voltage !== undefined ? { voltage: partial.voltage } : {}),
              ...(partial.resistance !== undefined ? { resistance: partial.resistance } : {}),
              ...(partial.switchClosed !== undefined
                ? { isClosed: partial.switchClosed ? 1 : 0 }
                : {}),
            }));
          }}
        />
      );
    }

    if (rendererKind === 'chemistry_beaker_scene') {
      const beakerMap: Record<string, number> = {};
      chemistryReagentIds.forEach((id) => {
        beakerMap[id] = 25;
      });
      const inventoryMap: Record<string, number> = {};
      REAGENTS.forEach((r) => {
        inventoryMap[r.id] = 100;
      });
      return (
        <ChemistryLabScene
          key={`chem-${viewportResetKey}`}
          temperature={simParameters.temperature ?? 25}
          concentration={simParameters.concentration ?? 1.0}
          catalyst={false}
          onUpdateConditions={(conds) =>
            setSimParameters((prev) => ({
              ...prev,
              ...(conds.temperature !== undefined ? { temperature: conds.temperature } : {}),
              ...(conds.concentration !== undefined ? { concentration: conds.concentration } : {}),
            }))
          }
          activeReaction={liveSimState.chemistryEvaluation?.reaction || null}
          reagentsInBeaker={beakerMap}
          inventory={inventoryMap}
          onPourReagent={(reagentId) => {
            setChemistryReagentIds((prev) =>
              prev.includes(reagentId) ? prev : [...prev, reagentId]
            );
          }}
          onResetBeaker={() => setChemistryReagentIds([])}
          hideReagentShelf={true}
        />
      );
    }

    if (rendererKind === 'biology_cell_scene') {
      return (
        <CellScene
          key={`cell-${viewportResetKey}`}
          selectedOrganelleId={selectedPartId || 'nucleus'}
          onSelectOrganelle={(id) => setSelectedPartId(id)}
        />
      );
    }

    if (rendererKind === 'biology_heart_scene') {
      return (
        <HeartScene
          key={`heart-${viewportResetKey}`}
          selectedStructureId={selectedPartId || 'left_ventricle'}
          onSelectStructure={(id) => setSelectedPartId(id)}
        />
      );
    }

    if (rendererKind === 'biology_dna_scene') {
      return (
        <DnaScene
          key={`dna-${viewportResetKey}`}
          selectedPairId={selectedPartId || 'at_pair'}
          onSelectPair={(id) => setSelectedPartId(id)}
        />
      );
    }

    const spec =
      activeCapability?.curatedSpec ||
      findCuratedSpecById(effectiveModelId) ||
      findCuratedSpecById('simple-pendulum');

    if (spec) {
      return (
        <Dynamic3DModelRenderer
          key={`dyn-${spec.id}-${viewportResetKey}`}
          modelSpec={spec}
          parameters={simParameters}
          selectedPartId={selectedPartId}
          onSelectPart={(part) => setSelectedPartId(part ? part.id : null)}
          onUpdateParameter={(paramId, val) =>
            setSimParameters((prev) => ({ ...prev, [paramId]: val }))
          }
          onResetAll={(defaultParams) => setSimParameters(defaultParams)}
        />
      );
    }

    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-center space-y-3">
        <Compass className="w-10 h-10 text-cyan-400 mx-auto" />
        <h4 className="text-base font-semibold text-white">{activeCapability?.title}</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {activeCapability?.suitabilityReason}
        </p>
        {activeCapability && (
          <button
            type="button"
            onClick={() => onLaunchModelInLab(activeCapability.launchTarget)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Native Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Arena Status & Telemetry Bar */}
      <div className="border-b border-slate-800/90 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {screenMode !== 'lobby' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.stopAllLoops();
                  setScreenMode('lobby');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Arena Lobby</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <span>Science Gaming Arena</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">
                  {capabilities.length} Verified Models Integrated
                </span>
              </div>
              <p className="text-sm font-bold text-white tracking-tight">
                Level {levelInfo.level} {levelInfo.rankTitle}
              </p>
            </div>
          </div>

          {/* Player XP, Accuracy, Badges & Sound Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="w-44 sm:w-52">
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1 font-mono tabular-nums">
                <span>{profile.xp} XP</span>
                <span>
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to Lvl{' '}
                  {levelInfo.level + 1}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-slate-300 font-mono tabular-nums">
              <span>Missions: {completedMissionsCount}</span>
              <span aria-hidden="true">·</span>
              <span>Score: {profile.totalScore}</span>
              <span aria-hidden="true">·</span>
              <span>Hypothesis Accuracy: {predictionAccuracy}%</span>
            </div>

            <button
              type="button"
              onClick={() => setShowBadgesPanel((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Achievements ({profile.unlockedBadgeIds.length}/{ARENA_ACHIEVEMENTS.length})
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleAudio}
              title={audioEnabled ? 'Mute Arena Sound Effects' : 'Enable Arena Sound Effects'}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 cursor-pointer"
            >
              {audioEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Achievements Drawer */}
        {showBadgesPanel && (
          <div className="border-t border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-5">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Scientific Mastery Achievements &amp; Saved Progress
                  </h3>
                  <p className="text-xs text-slate-400">
                    Progress is automatically persisted to this device (Local Storage Profile v1).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = resetArenaProfile();
                    setProfile(fresh);
                    soundEngine.playUiFeedback('button_subtle', 'arena_reset_profile');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Saved Progress</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ARENA_ACHIEVEMENTS.map((badge) => {
                  const unlocked = profile.unlockedBadgeIds.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        unlocked
                          ? 'bg-slate-800/90 border-cyan-500/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-100">
                          {badge.title}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-cyan-400">
                          +{badge.xpBonus} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {badge.description}
                      </p>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{badge.requirementText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          SCREEN 1: ARENA LOBBY DASHBOARD
         ===================================================================== */}
      {screenMode === 'lobby' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
          {/* Cinematic Science Laboratory Welcome Banner */}
          <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                  <span>Hybrid Science Gaming Arena</span>
                  <span aria-hidden="true">·</span>
                  <span>Interactive 3D Experiments &amp; Empirical Missions</span>
                </div>
                <h1
                  className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Master Physics, Chemistry &amp; Biology Through Live 3D Experimentation
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Formulate hypotheses, calibrate live 3D apparatus parameters, synthesize
                  stoichiometric chemical reactions in the virtual beaker, and verify real
                  mathematical laws across {capabilities.length} integrated science models.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartGameplay(activeMission)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Playing: {activeMission.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMissionForBriefing(missions[3] || missions[0])}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-100 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FlaskConical className="w-4 h-4 text-teal-400" />
                  <span>Launch Chemistry Reaction Quest</span>
                </button>
              </div>
            </div>

            {/* Resilient High-Precision Scientific SVG Hologram Stage */}
            <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-slate-950/90 p-5 flex flex-col justify-between relative overflow-hidden">
              <svg
                viewBox="0 0 420 220"
                className="w-full h-44 sm:h-48 select-none"
                role="img"
                aria-label="Interactive 3D Physics, Chemistry, and Biology Simulation Stage"
              >
                <defs>
                  <linearGradient id="arenaGridGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.06" />
                  </linearGradient>
                </defs>
                {/* Perspective Lab Coordinate Grid */}
                <g stroke="url(#arenaGridGrad)" strokeWidth="1">
                  <line x1="20" y1="190" x2="400" y2="190" />
                  <line x1="40" y1="160" x2="380" y2="160" />
                  <line x1="65" y1="130" x2="355" y2="130" />
                  <line x1="90" y1="100" x2="330" y2="100" />
                  <line x1="90" y1="100" x2="20" y2="190" />
                  <line x1="150" y1="100" x2="115" y2="190" />
                  <line x1="210" y1="100" x2="210" y2="190" />
                  <line x1="270" y1="100" x2="305" y2="190" />
                  <line x1="330" y1="100" x2="400" y2="190" />
                </g>

                {/* Keplerian Orbital Rings & Harmonic Pendulum Arc */}
                <ellipse
                  cx="130"
                  cy="95"
                  rx="72"
                  ry="28"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <circle cx="130" cy="95" r="14" fill="#0284c7" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="130" cy="95" r="5" fill="#38bdf8" />
                <circle cx="195" cy="84" r="5.5" fill="#2dd4bf" />

                {/* Transverse Harmonic Wave Curve */}
                <path
                  d="M 40 50 Q 75 15, 110 50 T 180 50 T 250 50 T 320 50 T 390 50"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.2"
                />

                {/* Parabolic Ballistic Trajectory & Target */}
                <path
                  d="M 245 170 Q 305 45, 370 170"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <circle cx="307" cy="107" r="4.5" fill="#c084fc" />
                <circle cx="370" cy="170" r="9" fill="none" stroke="#2dd4bf" strokeWidth="1.8" />
                <circle cx="370" cy="170" r="3.5" fill="#2dd4bf" />

                {/* Formula Callouts */}
                <text x="28" y="32" fill="#67e8f9" fontSize="10" fontFamily="monospace">
                  T = 2π√(L/g)
                </text>
                <text x="255" y="32" fill="#e9d5ff" fontSize="10" fontFamily="monospace">
                  R = (v₀² sin 2θ)/g
                </text>
                <text x="145" y="208" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃
                </text>
              </svg>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                <span>6 Hybrid Gameplay Modes</span>
                <span>·</span>
                <span>29 Core Science Models Ready</span>
              </div>
            </div>
          </section>

          {/* Recently Played Games Strip (when player has history) */}
          {profile.recentlyPlayed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  Recently Played Missions
                </h2>
                <span className="text-xs text-slate-400">
                  Resume your active empirical investigations
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {profile.recentlyPlayed.slice(0, 4).map((rec) => {
                  const mission = missions.find((m) => m.id === rec.missionId);
                  if (!mission) return null;
                  const completion = profile.completedMissions[mission.id];
                  return (
                    <div
                      key={rec.missionId}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>{mission.category}</span>
                          {completion && (
                            <span className="text-amber-400 font-mono tabular-nums">
                              {'★'.repeat(completion.stars)} ({completion.bestScore} pts)
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {mission.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartGameplay(mission)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Mission</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Featured Dedicated Science Games */}
          {featuredDedicatedMissions.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    01. Featured Dedicated Model Games
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Multi-stage interactive missions combining hypothesis prediction, live 3D simulation calibration, and quantitative puzzles
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {featuredDedicatedMissions.length} Flagship Campaigns
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredDedicatedMissions.map((mission) => {
                  const completion = profile.completedMissions[mission.id];
                  const cap = capabilityByModelId.get(mission.modelId);
                  return (
                    <div
                      key={mission.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/90 hover:border-cyan-500/40 transition-colors p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {mission.category} · {mission.difficulty} · {mission.estimatedMinutes} min
                          </span>
                          <span className="font-mono tabular-nums text-cyan-400">
                            +{mission.baseXpReward} XP
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white leading-snug">
                          {mission.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {mission.subtitle}
                        </p>

                        <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 font-mono text-xs text-cyan-300 truncate">
                          {mission.governingEquation}
                        </div>

                        {completion && (
                          <div className="text-xs text-emerald-400 font-mono tabular-nums flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Completed · {'★'.repeat(completion.stars)} · Best: {completion.bestScore}/
                              {mission.maxScore} pts
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleStartGameplay(mission)}
                          className="flex-1 py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Game</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectMissionForBriefing(mission)}
                          className="py-2 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Briefing
                        </button>
                        {cap && (
                          <button
                            type="button"
                            onClick={() => onLaunchModelInLab(cap.launchTarget)}
                            title="Open underlying model in its native Virtual Lab"
                            className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Search, Category, Hybrid Mode & Model Suitability Filter Deck */}
          <section className="space-y-5 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  02. Complete Science Model Game Directory ({filteredMissions.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every integrated model is automatically classified by its real simulation, parameter, and 3D inspection capabilities
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOnlyMy29Models((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  onlyMy29Models
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {onlyMy29Models ? 'Showing: My 29 Core Science Models' : 'Filter: My 29 Science Models'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search models, missions, equations (e.g., pendulum, Ohm, heart, PbI2)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Domain Filter */}
              <div className="md:col-span-4 flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
                {['All', 'Physics', 'Chemistry', 'Biology', 'Anatomy', 'Cross-Disciplinary'].map(
                  (dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => setSelectedDomain(dom)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedDomain === dom
                          ? 'bg-slate-800 text-cyan-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {dom}
                    </button>
                  )
                )}
              </div>

              {/* Suitability Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedSuitability}
                  onChange={(e) => setSelectedSuitability(e.target.value)}
                  aria-label="Filter by Model Suitability Tier"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Capability Tiers ({missions.length})</option>
                  <option value="dedicated_game">Dedicated Multi-Stage Games</option>
                  <option value="reusable_challenge">Interactive 3D Parameter Challenges</option>
                  <option value="knowledge_quiz_only">3D Structure &amp; Concept Quizzes</option>
                </select>
              </div>
            </div>

            {/* Hybrid Gameplay Mode Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Hybrid Modes' },
                { id: 'dedicated_game', label: 'Dedicated Model Games' },
                { id: 'science_mission', label: 'Science Missions' },
                { id: 'interactive_experiment', label: 'Interactive 3D Experiments' },
                { id: 'prediction_challenge', label: 'Prediction Challenges' },
                { id: 'science_puzzle', label: 'Science Puzzles' },
                { id: 'mixed_mission', label: 'Mixed Science Missions' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedGameMode(mode.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedGameMode === mode.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Directory Cards Grid */}
            {filteredMissions.length === 0 ? (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-200">
                  No science missions matched your current filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDomain('All');
                    setSelectedGameMode('all');
                    setSelectedSuitability('all');
                    setOnlyMy29Models(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMissions.map((mission) => {
                  const cap = capabilityByModelId.get(mission.modelId);
                  const completion = profile.completedMissions[mission.id];
                  const tierLabel =
                    cap?.suitabilityTier === 'dedicated_game'
                      ? 'Dedicated 3D Game'
                      : cap?.suitabilityTier === 'reusable_challenge'
                      ? 'Interactive 3D Challenge'
                      : 'Structure & Concept Quiz';

                  return (
                    <div
                      key={mission.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {cap?.my29Number ? `#${cap.my29Number} · ` : ''}
                            {mission.category} · {tierLabel}
                          </span>
                          <span className="font-mono tabular-nums text-cyan-400">
                            +{mission.baseXpReward} XP
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white leading-snug">
                          {mission.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {mission.scientificSummary}
                        </p>

                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                          <span>
                            Controls: {cap?.adjustableParameters.length ?? 0}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>3D Parts: {cap?.selectableParts.length ?? 0}</span>
                          {completion && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400">
                                {'★'.repeat(completion.stars)} ({completion.bestScore} pts)
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/70">
                        <button
                          type="button"
                          onClick={() => handleStartGameplay(mission)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Launch Mission</span>
                        </button>
                        {cap && (
                          <button
                            type="button"
                            onClick={() => onLaunchModelInLab(cap.launchTarget)}
                            className="py-1.5 px-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span>Lab</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* =====================================================================
          SCREEN 2: MISSION SELECTION & SCIENTIFIC BRIEFING
         ===================================================================== */}
      {screenMode === 'briefing' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-400">
              <span>
                {activeMission.category} · {activeMission.difficulty} Difficulty ·{' '}
                {activeMission.estimatedMinutes} min
              </span>
              <span className="font-mono tabular-nums">
                Reward: +{activeMission.baseXpReward} XP · Max Score: {activeMission.maxScore} pts
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {activeMission.title}
              </h1>
              <p className="text-sm text-slate-300">{activeMission.subtitle}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Governing Equation / Principle</span>
              <p className="font-mono text-sm font-bold text-cyan-300">
                {activeMission.governingEquation}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <h3 className="font-bold text-white text-sm">Scientific Mechanism</h3>
                <p className="text-slate-300">{activeMission.scientificSummary}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <h3 className="font-bold text-white text-sm">Real-World Engineering &amp; Clinical Context</h3>
                <p className="text-slate-300">{activeMission.realWorldApplication}</p>
              </div>
            </div>

            {/* 3-Stage Mission Roadmap */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">3-Stage Empirical Mission Sequence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold">01. Hypothesis Prediction</span>
                  <p className="text-slate-400">
                    Predict the physical, chemical, or biological behavior before running the experiment (100 pts).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold">02. Live 3D Experiment</span>
                  <p className="text-slate-400">
                    {activeMission.experimentStage.scientificGoal} (100 pts).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold">03. Quantitative / Concept Puzzle</span>
                  <p className="text-slate-400">
                    Apply the governing equation to verify theoretical mastery (100 pts).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setScreenMode('lobby')}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back to Directory
              </button>
              <button
                type="button"
                onClick={() => handleStartGameplay(activeMission)}
                className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Interactive 3D Mission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 3: IMMERSIVE INTERACTIVE GAMEPLAY SCREEN
         ===================================================================== */}
      {screenMode === 'gameplay' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Gameplay Header Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span>{activeMission.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeMission.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-300">
                  {activeMission.governingEquation}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {activeMission.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Mixed Mission Model Switcher (e.g., DC Motor <-> AC Generator) */}
              {activeMission.secondaryModelId && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModelIdOverride(null);
                      initializeMissionSimulationState(activeMission, null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap ${
                      !activeModelIdOverride
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Primary: {capabilityByModelId.get(activeMission.modelId)?.title || activeMission.modelId}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModelIdOverride(activeMission.secondaryModelId!);
                      initializeMissionSimulationState(
                        activeMission,
                        activeMission.secondaryModelId!
                      );
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap ${
                      activeModelIdOverride === activeMission.secondaryModelId
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paired: {capabilityByModelId.get(activeMission.secondaryModelId)?.title || activeMission.secondaryModelId}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetCurrentMissionState}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Model State</span>
              </button>

              {activeCapability && (
                <button
                  type="button"
                  onClick={() => onLaunchModelInLab(activeCapability.launchTarget)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Open in Full Lab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Two-Zone Sandbox Layout: Left 3D Stage (7 cols) + Right Mission & Control Deck (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT ZONE: Interactive 3D Viewport + Live Telemetry Strip */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                {renderInteractive3DViewport()}
              </div>

              {/* Live Calculated Simulation Telemetry Strip */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    Live Simulation Telemetry ({activeCapability?.title || effectiveModelId})
                  </span>
                  <span className="text-cyan-400 font-mono tabular-nums">
                    {liveSimState.summaryStatus}
                  </span>
                </div>

                {liveSimState.telemetryList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {liveSimState.telemetryList.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80"
                      >
                        <span className="text-[11px] text-slate-400 block">
                          {metric.label}
                        </span>
                        <span className="text-sm font-bold text-white font-mono tabular-nums">
                          {metric.formattedValue}
                        </span>
                        {metric.formula && (
                          <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                            {metric.formula}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT ZONE: 3-Stage Mission Controller & Interactive Parameter Deck */}
            <div className="lg:col-span-5 space-y-4">
              {/* Stage Stepper & Score Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Mission Progress · Stage {activeStage + 1} of 3
                  </span>
                  <span className="font-mono tabular-nums font-bold text-cyan-400">
                    Score: {sessionScore} / {activeMission.maxScore} pts
                    {hintsUsed > 0 ? ` (${hintsUsed} hint used: -${hintsUsed * 25} pts)` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { idx: 0 as ActiveStageIndex, label: '1. Predict', done: predictionSubmitted },
                    { idx: 1 as ActiveStageIndex, label: '2. Experiment', done: experimentVerified },
                    { idx: 2 as ActiveStageIndex, label: '3. Puzzle', done: puzzleSubmitted },
                  ].map((s) => (
                    <button
                      key={s.idx}
                      type="button"
                      onClick={() => setActiveStage(s.idx)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        activeStage === s.idx
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : s.done
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {s.done && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAGE 1: PREDICTION CHALLENGE */}
              {activeStage === 0 && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-cyan-400">
                      Stage 01 · Scientific Hypothesis Prediction
                    </span>
                    <h2 className="text-base font-bold text-white leading-snug">
                      {activeMission.predictionStage.question}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {activeMission.predictionStage.contextPrompt}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {activeMission.predictionStage.options.map((opt) => {
                      const isSelected = selectedPredictionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={predictionSubmitted}
                          onClick={() => setSelectedPredictionId(opt.id)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-colors cursor-pointer ${
                            predictionSubmitted
                              ? opt.isCorrect
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                                : isSelected
                                ? 'bg-rose-950/60 border-rose-500/60 text-rose-100'
                                : 'bg-slate-950/50 border-slate-800 text-slate-500'
                              : isSelected
                              ? 'bg-cyan-950/60 border-cyan-400 text-white font-medium'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span>{opt.text}</span>
                            {predictionSubmitted && opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                          </div>
                          {predictionSubmitted && (isSelected || opt.isCorrect) && (
                            <p className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                              {opt.explanation}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!predictionSubmitted ? (
                    <button
                      type="button"
                      disabled={!selectedPredictionId}
                      onClick={handleSubmitPrediction}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Lock In Hypothesis Prediction
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-cyan-300">Empirical Takeaway:</strong>{' '}
                        {activeMission.predictionStage.postExperimentTakeaway}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveStage(1)}
                        className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Proceed to Stage 2: Interactive 3D Experiment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 2: INTERACTIVE 3D EXPERIMENT & PARAMETER CALIBRATION */}
              {activeStage === 1 && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-cyan-400">
                        Stage 02 · Interactive 3D Experiment
                      </span>
                      <h2 className="text-base font-bold text-white leading-snug">
                        {activeMission.experimentStage.scientificGoal}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevealHint(1)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hint (-25 pts)</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeMission.experimentStage.instruction}
                  </p>

                  {revealedStageHints[1] && (
                    <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs">
                      <strong>Lab Hint:</strong> {activeMission.experimentStage.hintText}
                    </div>
                  )}

                  {/* Chemistry Beaker Reagent Controls (for Chemistry Reaction Quest) */}
                  {effectiveModelId === 'standalone-chemistry-beaker-lab' && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Select Reagents to Pour into 3D Beaker:
                        </span>
                        <button
                          type="button"
                          onClick={() => setChemistryReagentIds([])}
                          className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Clear Beaker ({chemistryReagentIds.length} added)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(
                          activeMission.experimentStage.recommendedReagentPool || [
                            'pb_no3_2',
                            'ki',
                            'hcl',
                            'nahco3',
                            'agno3',
                            'nacl',
                            'cuso4',
                            'naoh',
                          ]
                        ).map((rId) => {
                          const reagent = REAGENTS.find((r) => r.id === rId);
                          if (!reagent) return null;
                          const isAdded = chemistryReagentIds.includes(rId);
                          return (
                            <button
                              key={rId}
                              type="button"
                              onClick={() =>
                                setChemistryReagentIds((prev) =>
                                  prev.includes(rId)
                                    ? prev.filter((x) => x !== rId)
                                    : [...prev, rId]
                                )
                              }
                              className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                                isAdded
                                  ? 'bg-cyan-950/70 border-cyan-400 text-white font-semibold'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="font-bold truncate">{reagent.name}</div>
                              <div className="font-mono text-[11px] text-cyan-400">
                                {reagent.formula}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Live Adjustable Parameter Sliders */}
                  {activeCapability && activeCapability.adjustableParameters.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <span className="text-xs font-bold text-white block">
                        3D Apparatus Parameter Controls:
                      </span>
                      {activeCapability.adjustableParameters.map((param) => {
                        const val = simParameters[param.id] ?? param.defaultValue;
                        return (
                          <div key={param.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <label
                                htmlFor={`arena-slider-${param.id}`}
                                className="text-slate-300 font-medium"
                              >
                                {param.name}
                              </label>
                              <span className="font-mono tabular-nums text-cyan-300 font-bold">
                                {val} {param.unit}
                              </span>
                            </div>
                            <input
                              id={`arena-slider-${param.id}`}
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={val}
                              onChange={(e) =>
                                setSimParameters((prev) => ({
                                  ...prev,
                                  [param.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full accent-cyan-400 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3D Structure / Organelle / Component Selector */}
                  {activeCapability && activeCapability.selectableParts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-xs font-bold text-white block">
                        3D Structure Inspector (Click in 3D or Select Below):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {activeCapability.selectableParts.map((part) => {
                          const isSel = selectedPartId === part.id;
                          return (
                            <button
                              key={part.id}
                              type="button"
                              onClick={() => setSelectedPartId(part.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                isSel
                                  ? 'bg-cyan-400 text-slate-950 font-bold'
                                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {part.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Experiment Verification Feedback Box */}
                  {experimentFeedback && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                        experimentPassedLastCheck || experimentVerified
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                          : 'bg-amber-950/60 border-amber-500/50 text-amber-100'
                      }`}
                    >
                      {experimentPassedLastCheck || experimentVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p>{experimentFeedback}</p>
                        {experimentVerified && (
                          <p className="mt-1 text-emerald-300 font-medium">
                            {activeMission.experimentStage.successExplanation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleVerifyExperiment}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Target className="w-4 h-4" />
                      <span>Verify Experimental State</span>
                    </button>

                    {experimentVerified && (
                      <button
                        type="button"
                        onClick={() => setActiveStage(2)}
                        className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Stage 3: Puzzle</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 3: SCIENCE PUZZLE & MISSION COMPLETION */}
              {activeStage === 2 && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-cyan-400">
                        Stage 03 · Quantitative &amp; Concept Puzzle
                      </span>
                      <h2 className="text-base font-bold text-white leading-snug">
                        {activeMission.puzzleStage.prompt}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevealHint(2)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hint (-25 pts)</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
                    Reference: {activeMission.puzzleStage.formulaReference}
                  </div>

                  {revealedStageHints[2] && (
                    <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs">
                      <strong>Hint:</strong> {activeMission.puzzleStage.hintText}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activeMission.puzzleStage.options.map((opt) => {
                      const isSelected = selectedPuzzleOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={puzzleSubmitted}
                          onClick={() => setSelectedPuzzleOptionId(opt.id)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-colors cursor-pointer ${
                            puzzleSubmitted
                              ? opt.isCorrect
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                                : isSelected
                                ? 'bg-rose-950/60 border-rose-500/60 text-rose-100'
                                : 'bg-slate-950/50 border-slate-800 text-slate-500'
                              : isSelected
                              ? 'bg-cyan-950/60 border-cyan-400 text-white font-medium'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span>{opt.label}</span>
                            {puzzleSubmitted && opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                          </div>
                          {puzzleSubmitted && (isSelected || opt.isCorrect) && (
                            <p className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                              {opt.scientificFeedback}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!puzzleSubmitted ? (
                    <button
                      type="button"
                      disabled={!selectedPuzzleOptionId}
                      onClick={handleSubmitPuzzle}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Submit Solution &amp; Complete Mission
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.stopAllLoops();
                        setScreenMode('results');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>View Mission Results &amp; Scientific Summary</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 4: MISSION RESULTS & SCIENTIFIC EXPLANATION SCREEN
         ===================================================================== */}
      {screenMode === 'results' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-cyan-400">
                  Empirical Investigation Complete
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {activeMission.title}
                </h1>
              </div>

              <div className="text-right font-mono tabular-nums">
                <div className="text-2xl font-bold text-amber-400">
                  {'★'.repeat(completionSummary?.starsEarned || 2)}
                </div>
                <div className="text-sm text-white font-bold">
                  {sessionScore} / {activeMission.maxScore} pts
                </div>
                <div className="text-xs text-cyan-400">
                  +{completionSummary?.xpGained || 150} XP Earned
                </div>
              </div>
            </div>

            {/* Stage Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">01. Hypothesis Prediction</span>
                <p className="text-sm font-bold text-white">
                  {predictionCorrect ? 'Validated (+100 pts)' : 'Reviewed (+35 pts)'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">02. Live 3D Experiment</span>
                <p className="text-sm font-bold text-white">
                  {experimentVerified ? 'Calibrated & Verified (+100 pts)' : 'Explored'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">03. Quantitative Puzzle</span>
                <p className="text-sm font-bold text-white">
                  {puzzleCorrect ? 'Solved (+100 pts)' : 'Reviewed (+40 pts)'}
                </p>
              </div>
            </div>

            {/* Newly Unlocked Badges */}
            {completionSummary && completionSummary.newlyUnlockedBadges.length > 0 && (
              <div className="p-4 rounded-xl bg-cyan-950/50 border border-cyan-500/40 space-y-2">
                <span className="text-xs font-bold text-cyan-300 block">
                  New Scientific Achievement Unlocked!
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {completionSummary.newlyUnlockedBadges.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs"
                    >
                      <div className="font-bold text-white">
                        {b.title} (+{b.xpBonus} XP)
                      </div>
                      <p className="text-slate-300 mt-0.5">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scientific Synthesis & Equations */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">
                Verified Scientific Synthesis &amp; Governing Law
              </h3>
              <p className="font-mono text-xs text-cyan-300">
                {activeMission.governingEquation}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeMission.scientificSummary}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Engineering &amp; Clinical Relevance:</strong>{' '}
                {activeMission.realWorldApplication}
              </p>
            </div>

            {/* Post-Mission Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartGameplay(activeMission)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Mission</span>
                </button>
                {activeCapability && (
                  <button
                    type="button"
                    onClick={() => onLaunchModelInLab(activeCapability.launchTarget)}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open in Full Virtual Lab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreenMode('lobby')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Return to Arena Lobby
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = missions.findIndex((m) => m.id === activeMission.id);
                    const nextMission = missions[(idx + 1) % missions.length];
                    handleStartGameplay(nextMission);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Science Mission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
