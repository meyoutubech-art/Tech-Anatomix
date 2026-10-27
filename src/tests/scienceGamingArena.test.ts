import test from 'node:test';
import assert from 'node:assert';
import {
  discoverAllArenaModels,
  evaluateModelSimulationState,
  MY_SCIENCE_MODELS_29,
} from '../gaming/modelGameAdapter';
import {
  getAllArenaMissions,
  evaluateExperimentCompletion,
} from '../gaming/scienceMissionsData';
import {
  createDefaultArenaProfile,
  recordMissionCompletion,
  calculateLevelFromXp,
  ARENA_ACHIEVEMENTS,
} from '../gaming/gameProgressStore';

test('TECH-ANATOMIX — Hybrid Science Gaming Arena Verification Suite', async (t) => {
  await t.test('1. MODEL-TO-GAME DISCOVERY & SUITABILITY: Discovers all registry models and preserves all 29 My Science Models', () => {
    const capabilities = discoverAllArenaModels();
    assert.ok(capabilities.length >= 120, `Expected at least 120 discovered models, found ${capabilities.length}`);

    const my29Capabilities = capabilities.filter((c) => c.isInMy29Models);
    assert.strictEqual(
      my29Capabilities.length,
      MY_SCIENCE_MODELS_29.length,
      'Every one of the 29 My Science Models must be discovered in the Gaming Arena'
    );

    const dedicatedCount = capabilities.filter((c) => c.suitabilityTier === 'dedicated_game').length;
    const reusableCount = capabilities.filter((c) => c.suitabilityTier === 'reusable_challenge').length;
    const quizCount = capabilities.filter((c) => c.suitabilityTier === 'knowledge_quiz_only').length;

    assert.ok(dedicatedCount >= 15, 'Must classify flagship simulations as dedicated_game');
    assert.ok(reusableCount >= 50, 'Must classify parameterized 3D models as reusable_challenge');
    assert.ok(quizCount >= 20, 'Must classify structural/procedural models honestly as knowledge_quiz_only');
  });

  await t.test('2. MISSION CATALOGUE & HYBRID MODES: Every suitable model has a validated 3-stage mission', () => {
    const { missions } = getAllArenaMissions();
    assert.ok(missions.length >= 120, 'All suitable models must have playable validated missions');

    for (const m of missions) {
      assert.ok(m.id && m.title && m.governingEquation, `Mission ${m.id} must have title and equation`);
      assert.strictEqual(m.predictionStage.options.length, 3, `Mission ${m.id} must have 3 prediction options`);
      assert.strictEqual(
        m.predictionStage.options.filter((o) => o.isCorrect).length,
        1,
        `Mission ${m.id} must have exactly 1 correct prediction option`
      );
      assert.strictEqual(
        m.puzzleStage.options.filter((o) => o.isCorrect).length,
        1,
        `Mission ${m.id} must have exactly 1 correct puzzle option`
      );
    }
  });

  await t.test('3. SCIENTIFIC SIMULATION & EXPERIMENT VERIFICATION: Real engines govern completion criteria', () => {
    const { missions } = getAllArenaMissions();

    // A. Simple Pendulum Mission: uncalibrated L = 1.65 m fails [1.95, 2.08] s target; calibrated L = 1.00 m passes
    const pendulumMission = missions.find((m) => m.id === 'mission-pendulum-timekeeper')!;
    const uncalibratedPendulum = evaluateModelSimulationState('simple-pendulum', {
      length: 1.65,
      gravity: 9.81,
      mass: 1.0,
      initialAngle: 25,
    });
    const failCheck = evaluateExperimentCompletion(
      pendulumMission.experimentStage.targetCondition,
      uncalibratedPendulum,
      null
    );
    assert.strictEqual(failCheck.passed, false, 'Uncalibrated pendulum (L=1.65m, T=2.58s) must not pass 2.0s target');

    const calibratedPendulum = evaluateModelSimulationState('simple-pendulum', {
      length: 1.0,
      gravity: 9.81,
      mass: 2.5, // Even with different mass, period remains ~2.01 s!
      initialAngle: 25,
    });
    const passCheck = evaluateExperimentCompletion(
      pendulumMission.experimentStage.targetCondition,
      calibratedPendulum,
      null
    );
    assert.strictEqual(passCheck.passed, true, 'Calibrated seconds pendulum (L=1.0m, T=2.01s) must pass target');

    // B. Projectile Motion Mission: R in [58.0, 66.0] m
    const projMission = missions.find((m) => m.id === 'mission-projectile-ballistics')!;
    const passProj = evaluateModelSimulationState('projectile-motion', {
      velocity: 25,
      angle: 45,
      gravity: 9.81,
      mass: 2.0,
    });
    assert.strictEqual(
      evaluateExperimentCompletion(projMission.experimentStage.targetCondition, passProj, null).passed,
      true,
      'Projectile at v0=25 m/s, angle=45 deg (R=63.7m) must pass target window'
    );

    // C. DC Circuit Mission: P in [18.0, 25.0] W
    const circuitMission = missions.find((m) => m.id === 'mission-dc-circuit-engineering')!;
    const passCircuit = evaluateModelSimulationState('electric-circuit', {
      voltage: 15.0,
      resistance: 10.0,
      isClosed: 1,
    });
    assert.strictEqual(
      evaluateExperimentCompletion(circuitMission.experimentStage.targetCondition, passCircuit, null).passed,
      true,
      'Circuit at V=15V, R=10 Ohm (P=22.5W) must pass target window'
    );

    // D. Chemistry Reaction Quest: Pb(NO3)2 + KI forms PbI2 precipitate
    const chemMission = missions.find((m) => m.id === 'mission-chemistry-precipitation-quest')!;
    const chemNoRx = evaluateModelSimulationState('standalone-chemistry-beaker-lab', { temperature: 25 }, ['nacl']);
    assert.strictEqual(
      evaluateExperimentCompletion(chemMission.experimentStage.targetCondition, chemNoRx, null).passed,
      false,
      'Single reagent NaCl must not falsely trigger precipitation completion'
    );

    const chemPptRx = evaluateModelSimulationState(
      'standalone-chemistry-beaker-lab',
      { temperature: 25, concentration: 1.0 },
      ['pb_no3_2', 'ki']
    );
    assert.strictEqual(
      evaluateExperimentCompletion(chemMission.experimentStage.targetCondition, chemPptRx, null).passed,
      true,
      'Pb(NO3)2 + KI must trigger verified PbI2 precipitation completion'
    );
  });

  await t.test('4. SCORING, XP, LEVELS & ACHIEVEMENTS: Deterministic progression & badge unlocks', () => {
    let profile = createDefaultArenaProfile();
    assert.strictEqual(profile.level, 1);
    assert.strictEqual(profile.xp, 0);

    // Complete first Physics mission with 300/300 score and 0 hints
    const outcome1 = recordMissionCompletion(profile, {
      missionId: 'mission-pendulum-timekeeper',
      modelId: 'simple-pendulum',
      category: 'Physics',
      score: 300,
      maxScore: 300,
      baseXpReward: 250,
      hintsUsed: 0,
      predictionCorrect: true,
      experimentVerified: true,
      puzzleSolved: true,
    });

    profile = outcome1.updatedProfile;
    assert.strictEqual(outcome1.starsEarned, 3);
    assert.ok(profile.unlockedBadgeIds.includes('first_empirical_proof'));
    assert.ok(profile.unlockedBadgeIds.includes('harmonic_physicist'));
    assert.ok(profile.unlockedBadgeIds.includes('zero_hint_theorist'));
    assert.ok(profile.xp >= 250);
    assert.ok(ARENA_ACHIEVEMENTS.length >= 8);

    const lvl = calculateLevelFromXp(profile.xp);
    assert.strictEqual(profile.level, lvl.level);
  });
});
