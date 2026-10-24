import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  StateDrivenSoundEngine,
  resolveValidatedModelAudioConfig,
  DEFAULT_AUDIO_SETTINGS,
} from '../utils/soundEngine';
import { REAGENTS, evaluateReactionRecipe } from '../data/reactionsData';
import { findOrLookupCompound } from '../data/compoundRegistry';
import { discoverReactions } from '../data/reactionDiscoveryEngine';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BIOLOGY_BATCH_1_MODELS } from '../data/curatedModelsBatch3';
import { synthesizeProceduralScientificModel } from '../utils/proceduralModelSynthesizer';

describe('Tech-Anatomix State-Driven Realistic Audio & Scientific Synchronization', () => {
  let engine: StateDrivenSoundEngine;

  beforeEach(() => {
    engine = new StateDrivenSoundEngine();
    engine.updateSettings({ ...DEFAULT_AUDIO_SETTINGS, enabled: true });
    engine.stopAllLoops();
    engine.clearEventLog();
  });

  // 1-3. Heartbeat & Circulatory System Synchronization
  it('1-3. synchronizes heartbeat audio with active heart model, updates timing when BPM changes, and stops when paused or unloaded', () => {
    // 1. Starts when active & playing
    engine.syncHeartbeat({
      sourceId: 'heart-scene',
      active: true,
      bpm: 72,
      isPlaying: true,
    });

    let loop = engine.getActiveLoop('heart-scene::heartbeat');
    assert.ok(loop);
    assert.equal(loop.kind, 'heartbeat');
    assert.equal(loop.rateOrBpm, 72);
    assert.equal(loop.metadata.beatIntervalMs, Math.round(60000 / 72));

    // 2. Updates timing smoothly when BPM increases or decreases
    engine.syncHeartbeat({
      sourceId: 'heart-scene',
      active: true,
      bpm: 120,
      isPlaying: true,
    });
    loop = engine.getActiveLoop('heart-scene::heartbeat');
    assert.equal(loop?.rateOrBpm, 120);
    assert.equal(loop?.metadata.beatIntervalMs, 500);
    assert.equal(engine.getActiveLoopsBySource('heart-scene').length, 1);

    engine.syncHeartbeat({
      sourceId: 'heart-scene',
      active: true,
      bpm: 50,
      isPlaying: true,
    });
    loop = engine.getActiveLoop('heart-scene::heartbeat');
    assert.equal(loop?.rateOrBpm, 50);
    assert.equal(loop?.metadata.beatIntervalMs, 1200);

    // 3. Stops when paused or unloaded
    engine.syncHeartbeat({
      sourceId: 'heart-scene',
      active: true,
      bpm: 50,
      isPlaying: false,
    });
    assert.equal(engine.getActiveLoop('heart-scene::heartbeat'), undefined);
  });

  // 4. Lung Breathing / Respiratory System Synchronization
  it('4. synchronizes respiratory airflow audio with active breathing state and breathing rate', () => {
    engine.syncRespiration({
      sourceId: 'respiratory-explorer',
      active: true,
      breathsPerMinute: 15,
      isPlaying: true,
      tidalVolumeL: 0.5,
    });

    let loop = engine.getActiveLoop('respiratory-explorer::respiration');
    assert.ok(loop);
    assert.equal(loop.rateOrBpm, 15);
    assert.equal(loop.metadata.breathCycleSec, 4);

    // Increase breathing rate to 30 breaths/min
    engine.syncRespiration({
      sourceId: 'respiratory-explorer',
      active: true,
      breathsPerMinute: 30,
      isPlaying: true,
      tidalVolumeL: 0.8,
    });
    loop = engine.getActiveLoop('respiratory-explorer::respiration');
    assert.equal(loop?.rateOrBpm, 30);
    assert.equal(loop?.metadata.breathCycleSec, 2);

    // Stop when paused
    engine.syncRespiration({
      sourceId: 'respiratory-explorer',
      active: true,
      breathsPerMinute: 30,
      isPlaying: false,
    });
    assert.equal(engine.getActiveLoop('respiratory-explorer::respiration'), undefined);
  });

  // 5-6. Reagent Addition Audio (Liquid vs Solid & Deduplication)
  it('5-6. plays liquid pouring sound for liquid reagents and granular solid sound for solid reagents without duplicate triggers', () => {
    const hcl = REAGENTS.find((r) => r.id === 'hcl')!;
    const zn = REAGENTS.find((r) => r.id === 'zn')!;

    // 5. Liquid pouring sound
    const playedLiquid = engine.playReagentAddition({
      reagentId: hcl.id,
      name: hcl.name,
      state: hcl.state,
      amount: hcl.pourAmount,
      unit: hcl.unit,
      dedupeKey: 'pour_hcl_1',
    });
    assert.equal(playedLiquid, true);

    // Duplicate rerender with same dedupeKey is suppressed
    const duplicateLiquid = engine.playReagentAddition({
      reagentId: hcl.id,
      name: hcl.name,
      state: hcl.state,
      amount: hcl.pourAmount,
      unit: hcl.unit,
      dedupeKey: 'pour_hcl_1',
    });
    assert.equal(duplicateLiquid, false);

    // 6. Solid addition sound
    const playedSolid = engine.playReagentAddition({
      reagentId: zn.id,
      name: zn.name,
      state: zn.state,
      amount: zn.pourAmount,
      unit: zn.unit,
      dedupeKey: 'add_zn_1',
    });
    assert.equal(playedSolid, true);

    const events = engine.getEventLog();
    assert.equal(events.length, 2);
    assert.equal(events[0].subtype, 'liquid_pour_add');
    assert.equal(events[1].subtype, 'solid_granular_add');
  });

  // 7-12. Chemistry Reaction State Synchronization
  it('7-12. plays effervescence/boiling/combustion only when justified by reaction state and keeps homogeneous/unsupported reactions silent', () => {
    // 7. Gas-evolving reaction (Zn + HCl -> H2 gas)
    const gasEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'zn', amount: 10 },
        { id: 'hcl', amount: 25 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(gasEval.isSupported, true);
    assert.equal(gasEval.reaction?.observableEffects.producesGas, true);

    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 35,
      temperatureC: 43,
      reactionProgress: 0.3,
      activeReaction: gasEval.reaction,
      reactionRunKey: 'zn_hcl::1',
    });

    assert.ok(engine.getActiveLoop('chemistry-lab::chemistry_effervescence'));
    assert.equal(engine.getActiveLoop('chemistry-lab::chemistry_boiling'), undefined);

    // 11. Reaction sound stops when reaction completes (progress = 1.0)
    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 35,
      temperatureC: 43,
      reactionProgress: 1.0,
      activeReaction: gasEval.reaction,
      reactionRunKey: 'zn_hcl::1',
    });
    assert.equal(engine.getActiveLoop('chemistry-lab::chemistry_effervescence'), undefined);

    // 8. Boiling sound plays ONLY when liquid is present and temperature >= 100°C
    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 50,
      temperatureC: 105,
      reactionProgress: 0,
      activeReaction: null,
    });
    assert.ok(engine.getActiveLoop('chemistry-lab::chemistry_boiling'));

    // Empty beaker at 120°C does NOT play boiling sound
    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: false,
      totalVolume: 0,
      temperatureC: 120,
      reactionProgress: 0,
      activeReaction: null,
    });
    assert.equal(engine.getActiveLoop('chemistry-lab::chemistry_boiling'), undefined);

    // 9. Violent combustion reaction (Potassium + Water -> alkali_explosion)
    const kWaterEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'k_metal', amount: 10 },
        { id: 'water', amount: 30 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(kWaterEval.isSupported, true);
    assert.equal(kWaterEval.reaction?.observableEffects.isViolent, true);

    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 45,
      temperatureC: 90,
      reactionProgress: 0.2,
      activeReaction: kWaterEval.reaction,
      reactionRunKey: 'k_water::1',
    });
    assert.ok(engine.getActiveLoop('chemistry-lab::chemistry_foaming'));
    assert.equal(
      engine.getEventLog().some((e) => e.category === 'chemistry_reaction_burst' && e.subtype === 'violent_combustion_burst'),
      true
    );

    // 10. Homogeneous neutralization reaction (HCl + NaOH -> NaCl + H2O) produces NO physical bubbling/boiling/foaming loops
    engine.stopSource('chemistry-lab');
    const neutEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 25 },
        { id: 'naoh', amount: 25 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(neutEval.isSupported, true);
    assert.equal(neutEval.reaction?.observableEffects.producesGas, false);

    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 50,
      temperatureC: 38,
      reactionProgress: 0.5,
      activeReaction: neutEval.reaction,
      reactionRunKey: 'hcl_naoh::1',
    });
    assert.equal(engine.getActiveLoopsBySource('chemistry-lab').length, 0);

    // 12. Unsupported reaction combination produces zero physical reaction loops
    const unsupportedEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'nacl', amount: 20 },
        { id: 'cuso4', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(unsupportedEval.isSupported, false);
    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 40,
      temperatureC: 25,
      reactionProgress: 0,
      activeReaction: unsupportedEval.reaction,
    });
    assert.equal(engine.getActiveLoopsBySource('chemistry-lab').length, 0);
  });

  // 13. AI-added compounds and AI-discovered reactions follow the same audio rules
  it('13. applies identical state-driven audio rules to AI-added compounds and AI-discovered reactions', () => {
    const bakingSodaLookup = findOrLookupCompound('Baking Soda');
    assert.equal(bakingSodaLookup.found, true);
    assert.equal(bakingSodaLookup.compound?.state, 'solid');

    engine.playReagentAddition({
      reagentId: bakingSodaLookup.compound!.id,
      name: bakingSodaLookup.compound!.name,
      state: bakingSodaLookup.compound!.state,
      amount: bakingSodaLookup.compound!.pourAmount,
      unit: bakingSodaLookup.compound!.unit,
      dedupeKey: 'ai_add_nahco3',
    });
    assert.equal(engine.getEventLog().at(-1)?.subtype, 'solid_granular_add');

    const discovery = discoverReactions('Find a reaction in which effervescence occurs.');
    assert.ok(discovery.options.length > 0);
    const chosen = discovery.options[0];
    const evalRes = evaluateReactionRecipe({
      ingredients: chosen.reactants.map((r) => ({
        id: r.id,
        amount: r.amount,
      })),
      conditions: { temperature: 25, concentration: 1.0, catalystId: chosen.catalystId },
    });
    assert.equal(evalRes.isSupported, true);
    assert.equal(evalRes.reaction?.observableEffects.producesGas, true);

    engine.syncChemistryReactionState({
      sourceId: 'chemistry-lab',
      hasLiquid: true,
      totalVolume: 40,
      temperatureC: 25,
      reactionProgress: 0.4,
      activeReaction: evalRes.reaction,
      reactionRunKey: 'ai_discovered_gas::1',
    });
    assert.ok(engine.getActiveLoop('chemistry-lab::chemistry_effervescence'));
  });

  // 14-17. Preset & AI-Generated Custom Three.js Model Audio Synchronization
  it('14-17. updates motor/pendulum pitch & gain when parameters change, stops when paused/zeroed, and keeps static models silent', () => {
    // 14. Rotating DC motor increases pitch/gain when voltage/speed increases
    const motorSpec = CURATED_AI_MODELS.motor;
    const motorCfg = resolveValidatedModelAudioConfig(motorSpec);
    assert.equal(motorCfg.enabled, true);
    assert.equal(motorCfg.category, 'rotational_motor');

    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: motorSpec,
      isPlaying: true,
      parameters: { voltage: 4, magneticField: 0.5 },
    });
    const lowSpeedLoop = engine.getActiveLoop('dynamic-3d-renderer::model_rotational_motor');
    assert.ok(lowSpeedLoop);

    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: motorSpec,
      isPlaying: true,
      parameters: { voltage: 12, magneticField: 1.2 },
    });
    const highSpeedLoop = engine.getActiveLoop('dynamic-3d-renderer::model_rotational_motor');
    assert.ok(highSpeedLoop);
    assert.ok(highSpeedLoop.frequencyHz > lowSpeedLoop.frequencyHz);

    // 15. Stopping/pausing a rotating model or setting drive speed to 0 stops its motion sound
    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: motorSpec,
      isPlaying: false,
      parameters: { voltage: 12, magneticField: 1.2 },
    });
    assert.equal(engine.getActiveLoop('dynamic-3d-renderer::model_rotational_motor'), undefined);

    // 16. Custom AI-generated models with rotating/oscillating mechanisms receive validated audioConfig
    const customWindTurbine = synthesizeProceduralScientificModel('3D wind turbine generator');
    assert.equal(customWindTurbine.audioConfig?.enabled, true);
    assert.equal(customWindTurbine.audioConfig?.category, 'rotational_motor');

    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: customWindTurbine,
      isPlaying: true,
      parameters: { windSpeed: 12 },
    });
    assert.ok(engine.getActiveLoop('dynamic-3d-renderer::model_rotational_motor'));

    // 17. Static or non-audible models (e.g. Optical Prism, Methane Molecule) remain completely silent
    const prismSpec = CURATED_AI_MODELS.prismDispersion;
    assert.equal(resolveValidatedModelAudioConfig(prismSpec).enabled, false);

    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: prismSpec,
      isPlaying: true,
      parameters: { incidentAngle: 45, dispersionStrength: 35, prismApexAngle: 60 },
    });
    assert.equal(engine.getActiveLoopsBySource('dynamic-3d-renderer').length, 0);

    const customMethane = synthesizeProceduralScientificModel('Methane CH4 tetrahedral molecule');
    assert.equal(customMethane.audioConfig?.enabled, false);
    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: customMethane,
      isPlaying: true,
      parameters: {},
    });
    assert.equal(engine.getActiveLoopsBySource('dynamic-3d-renderer').length, 0);
  });

  // 18-22. Global Mute, Volume Persistence, Navigation Cleanup, and Rerender/Slider Stability
  it('18-22. honors global mute & volume settings, stops all loops on navigation, and prevents duplicate loops under rapid slider updates', () => {
    // Start biology heart explorer
    engine.syncModelSimulationAudio({
      sourceId: 'dynamic-3d-renderer',
      modelSpec: BIOLOGY_BATCH_1_MODELS.heartExplorer,
      isPlaying: true,
      parameters: { heartRate: 80 },
    });
    assert.equal(engine.getActiveLoops().length, 1);

    // 21 & 22. Rapid slider updates (25 consecutive parameter updates) never create duplicate loops
    for (let bpm = 60; bpm <= 160; bpm += 4) {
      engine.syncModelSimulationAudio({
        sourceId: 'dynamic-3d-renderer',
        modelSpec: BIOLOGY_BATCH_1_MODELS.heartExplorer,
        isPlaying: true,
        parameters: { heartRate: bpm },
      });
    }
    assert.equal(engine.getActiveLoopsBySource('dynamic-3d-renderer').length, 1);
    assert.equal(engine.getActiveLoop('dynamic-3d-renderer::heartbeat')?.rateOrBpm, 160);

    // 19. Volume settings update and scale effective gain
    engine.updateSettings({ masterVolume: 0.5, simulationVolume: 0.5, uiVolume: 0.4 });
    assert.equal(engine.getSettings().masterVolume, 0.5);
    assert.ok(Math.abs(engine.getEffectiveSimulationGain(1.0) - 0.25) < 1e-4);
    assert.ok(Math.abs(engine.getEffectiveUiGain(1.0) - 0.20) < 1e-4);

    // 18. Global mute disables all application audio cleanly and stops active loops
    engine.toggleMute();
    assert.equal(engine.getSettings().enabled, false);
    assert.equal(engine.getActiveLoops().length, 0);
    assert.equal(engine.getEffectiveSimulationGain(1.0), 0);

    // Re-enable and verify navigation cleanup (20)
    engine.toggleMute();
    assert.equal(engine.getSettings().enabled, true);
    engine.syncHeartbeat({ sourceId: 'heart-scene', active: true, bpm: 75, isPlaying: true });
    assert.equal(engine.getActiveLoops().length, 1);

    engine.stopAllLoops();
    assert.equal(engine.getActiveLoops().length, 0);
  });
});
