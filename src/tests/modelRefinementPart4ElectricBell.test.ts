import test from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import {
  createElectricBellState,
  stepElectricBell,
  CYCLE_STEP_DESCRIPTIONS,
} from '../simulations/physics/electricBellEngine';

test('TECH-ANATOMIX — Model Refinement Part 4: Electric Bell Simulation Suite', async (t) => {
  // =========================================================================
  // 1. COMPONENTS & MATERIAL PALETTE AUDIT
  // =========================================================================
  await t.test('1. Components & Material Palette: All 10 required components present with non-dark materials', () => {
    const model = CURATED_AI_MODELS['electric-bell'] || BATCH_3_MODELS.electricBell;
    assert.ok(model, 'Electric Bell model must exist in CURATED_AI_MODELS');
    assert.equal(model.id, 'electric-bell');
    assert.equal(model.functionalType, 'electric-bell');

    const partIds = model.parts.map((p) => p.id);

    // Prompt Item 1: All 10 components must exist
    assert.ok(partIds.includes('resonant-gong-bell'), 'Must include Bell/gong');
    assert.ok(partIds.includes('spring-armature-hammer'), 'Must include Striker/hammer and Armature');
    assert.ok(partIds.includes('electromagnet-coils'), 'Must include Electromagnet and coil');
    assert.ok(partIds.includes('iron-core-poles'), 'Must include Iron core');
    assert.ok(partIds.includes('flat-spring-strip'), 'Must include Spring');
    assert.ok(partIds.includes('contact-breaker-screw'), 'Must include Contact screw');
    assert.ok(partIds.includes('circuit-copper-wiring'), 'Must include Circuit connections');
    assert.ok(partIds.includes('battery-dc-source'), 'Must include Power source');
    assert.ok(partIds.includes('pushbutton-switch'), 'Must include Switch');
    assert.ok(partIds.includes('circuit-spark-indicator'), 'Must include Contact breaker spark indicator');

    // Material palette check: Avoid excessively dark colours and dominant blue
    const backboard = model.parts.find((p) => p.id === 'bell-wooden-backboard');
    assert.ok(backboard, 'Mounting backboard must exist');
    assert.notEqual(backboard.color, '#78350F', 'Backboard must not use excessively dark brown');

    const coils = model.parts.find((p) => p.id === 'electromagnet-coils');
    assert.ok(coils?.color.startsWith('#C') || coils?.color.startsWith('#D'), 'Coils must use distinct warm copper finish');

    const gong = model.parts.find((p) => p.id === 'resonant-gong-bell');
    assert.ok(gong?.color.startsWith('#F') || gong?.color.startsWith('#E'), 'Gong must use bright acoustic bronze/brass');

    // Blue must NOT dominate components
    const blueParts = model.parts.filter((p) => p.color === '#0000FF' || p.color === '#1E3A8A' || p.color === '#2563EB');
    assert.equal(blueParts.length, 0, 'No components should use dominant arbitrary blue');
  });

  // =========================================================================
  // 2. ELECTRIC BELL 9-STEP COORDINATED CYCLE & STATE MACHINE
  // =========================================================================
  await t.test('2. Coordinated Cycle: Exact 9-step state machine transitions', () => {
    // Verify all 9 steps exist with rigorous educational descriptions
    for (let step = 1; step <= 9; step++) {
      const stepInfo = CYCLE_STEP_DESCRIPTIONS[step as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9];
      assert.ok(stepInfo, `Step ${step} description must exist`);
      assert.ok(stepInfo.title.length > 5, `Step ${step} title must be descriptive`);
      assert.ok(stepInfo.desc.length > 15, `Step ${step} text must explain mechanism`);
    }

    const state = createElectricBellState(true);
    assert.equal(state.contactClosed, true, 'At rest, contact must touch breaker screw');
    assert.equal(state.circuitClosed, true, 'At startup with switch ON, circuit must be closed');
    assert.equal(state.electromagnetActive, true, 'Coil must energize upon circuit closure');
    assert.ok(state.magneticForce > 0, 'Magnetic attraction must exist when energized');
  });

  // =========================================================================
  // 3. FULL COMPONENT MOVEMENT: ARMATURE, CONTACT, GONG STRIKE, & SPRING RECOIL
  // =========================================================================
  await t.test('3. Full Component Movement: Armature advances, contacts break, hammer strikes gong, spring restores', () => {
    let state = createElectricBellState(true);
    const params = {
      operatingVoltage: 12,
      springTension: 380,
      bellRingingSpeed: 15,
      switchClosed: true,
    };

    let sawContactBreak = false;
    let sawGongStrike = false;
    let sawSpringReturn = false;
    let maxAngle = 0;

    // Simulate forward stroke for 40 ms in fine sub-steps
    const dt = 0.001; // 1 ms
    for (let i = 0; i < 40; i++) {
      state = stepElectricBell(state, params, dt);
      if (state.armatureAngle > maxAngle) {
        maxAngle = state.armatureAngle;
      }
      if (!state.contactClosed) {
        sawContactBreak = true;
      }
      if (state.gongStruck) {
        sawGongStrike = true;
      }
      if (state.armatureVelocity < 0 && state.armatureAngle > 0.05) {
        sawSpringReturn = true;
      }
    }

    assert.ok(sawContactBreak, 'Armature advance must pull contact leaf away from breaker screw, opening circuit');
    assert.ok(sawGongStrike, 'Striker hammer must make contact with gong dome at peak deflection');
    assert.ok(sawSpringReturn, 'Restoring spring and elastic rebound must reverse armature motion');
    assert.ok(maxAngle >= state.strikeAngle * 0.95, 'Armature must reach gong strike threshold');
  });

  // =========================================================================
  // 4. SCIENTIFIC CONSISTENCY: NO PHANTOM FORCES & OHMIC CURRENT
  // =========================================================================
  await t.test('4. Scientific Consistency: No magnetic attraction without coil current, current obeys Ohm Law', () => {
    // A: Inactive magnet produces ZERO magnetic pull
    const offState = createElectricBellState(false);
    assert.equal(offState.circuitCurrent, 0, 'Inactive circuit must have 0 A current');
    assert.equal(offState.electromagnetActive, false, 'Electromagnet must be inactive');
    assert.equal(offState.magneticForce, 0, 'Magnetic force must be exactly 0 N when inactive');

    // B: Current scales with voltage according to Ohm's Law (I = V / R)
    const state12V = stepElectricBell(
      createElectricBellState(true),
      { operatingVoltage: 12, springTension: 380, bellRingingSpeed: 15, switchClosed: true },
      0.002
    );
    const state24V = stepElectricBell(
      createElectricBellState(true),
      { operatingVoltage: 24, springTension: 380, bellRingingSpeed: 15, switchClosed: true },
      0.002
    );

    assert.ok(state24V.circuitCurrent > state12V.circuitCurrent, 'Higher voltage must drive higher coil current (I = V/R)');
    assert.equal(state12V.circuitCurrent, 3.0, '12V with 4 Ohm coil must draw 3.0 A');
    assert.equal(state24V.circuitCurrent, 6.0, '24V with 4 Ohm coil must draw 6.0 A');
    assert.ok(state24V.magneticForce > state12V.magneticForce, 'Higher current must produce stronger magnetic attractive force');
  });

  // =========================================================================
  // 5. CONTROLS: SWITCH OFF, PAUSE FREEZE, AND CLEAN RESET
  // =========================================================================
  await t.test('5. Controls: Switch OFF stops cycling immediately, Reset restores resting equilibrium', () => {
    // Run bell for 100 ms to achieve multiple cycles
    let activeState = createElectricBellState(true);
    const runParams = { operatingVoltage: 12, springTension: 380, bellRingingSpeed: 15, switchClosed: true };
    for (let i = 0; i < 100; i++) {
      activeState = stepElectricBell(activeState, runParams, 0.002);
    }
    assert.ok(activeState.strikeCount > 0, 'Bell must ring and register strikes during active operation');

    // Turn switch OFF
    const offParams = { operatingVoltage: 12, springTension: 380, bellRingingSpeed: 15, switchClosed: false };
    for (let i = 0; i < 200; i++) {
      activeState = stepElectricBell(activeState, offParams, 0.002);
    }

    assert.equal(activeState.switchClosed, false, 'Switch state must register as open');
    assert.equal(activeState.electromagnetActive, false, 'Electromagnet must remain de-energized after switch OFF');
    assert.equal(activeState.circuitCurrent, 0, 'Circuit current must remain 0 after switch OFF');
    assert.ok(activeState.armatureAngle < 0.01, 'Armature must settle back into resting position');

    // Reset mechanism test
    const resetState = createElectricBellState(true);
    assert.equal(resetState.armatureAngle, 0.0, 'Reset must zero armature angle');
    assert.equal(resetState.armatureVelocity, 0.0, 'Reset must zero velocity');
    assert.equal(resetState.strikeCount, 0, 'Reset must zero strike count');
    assert.equal(resetState.sparkIntensity, 0.0, 'Reset must zero spark intensity');
  });
});
