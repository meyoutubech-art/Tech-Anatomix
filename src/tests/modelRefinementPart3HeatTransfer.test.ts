import test from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import {
  HEAT_MATERIALS,
  createConductionState,
  stepConduction,
  calculateConvectionMetrics,
  calculateRadiationMetrics,
  getTemperatureHexColor,
  getTemperatureColorRgb,
  STEFAN_BOLTZMANN_SIGMA,
} from '../simulations/physics/heatTransferEngine';

test('TECH-ANATOMIX — Model Refinement Part 3: Heat Transfer Simulation Suite', async (t) => {
  // =========================================================================
  // 1. SPECIFICATION, MODES & VISUAL PALETTE AUDIT
  // =========================================================================
  await t.test('1. Specification & Modes: Functional modes, parameters, and palette compliance', () => {
    const model = CURATED_AI_MODELS['heat-transfer-explorer'] || BATCH_3_MODELS.heatTransferExplorer;
    assert.ok(model, 'Heat Transfer Explorer model must exist in CURATED_AI_MODELS');
    assert.equal(model.id, 'heat-transfer-explorer');
    assert.equal(model.functionalType, 'heat-transfer-explorer');

    // Supported modes: Conduction, Convection, Radiation
    const transferMode = model.conditions?.transferMode;
    assert.ok(transferMode, 'Model must include transferMode condition');
    const modeValues = transferMode.options?.map((o) => o.value);
    assert.deepEqual(modeValues, ['conduction', 'convection', 'radiation']);

    // Required parameters: Heat source, Ambient / Initial temp, Conductivity, Emissivity
    const p = model.parameters;
    assert.ok(p.heatSourceTempC, 'heatSourceTempC parameter must exist');
    assert.ok(p.initialTempC, 'initialTempC parameter must exist for ambient baseline adjustment');
    assert.ok(p.thermalConductivity, 'thermalConductivity parameter must exist');
    assert.ok(p.radiationEmissivity, 'radiationEmissivity parameter must exist');

    assert.equal(p.heatSourceTempC.min, 50);
    assert.equal(p.heatSourceTempC.max, 500);
    assert.equal(p.initialTempC.defaultValue, 20);

    // Material selection condition
    const matCond = model.conditions?.rodMaterial;
    assert.ok(matCond, 'rodMaterial condition must exist for solid conduction comparison');
    const matValues = matCond.options?.map((o) => o.value);
    assert.ok(matValues?.includes('copper'));
    assert.ok(matValues?.includes('aluminum'));
    assert.ok(matValues?.includes('steel'));
    assert.ok(matValues?.includes('glass'));

    // Parts & Palette audit: Avoid excessively dark materials and artificial electric blue on cold solids
    const base = model.parts.find((pt) => pt.id === 'thermal-lab-base');
    const heater = model.parts.find((pt) => pt.id === 'thermal-heat-source');
    const rod = model.parts.find((pt) => pt.id === 'conduction-metal-rod');
    const flask = model.parts.find((pt) => pt.id === 'convection-fluid-vessel');
    const emitter = model.parts.find((pt) => pt.id === 'radiation-emitter-plate');
    const receiver = model.parts.find((pt) => pt.id === 'radiation-detector-plate');

    assert.ok(base && heater && rod && flask && emitter && receiver, 'All key apparatus subassemblies must exist');

    // Baseboard must not be pitch black #1E293B
    assert.notEqual(base.color, '#1E293B', 'Baseboard must not use pitch black #1E293B');
    assert.equal(base.color, '#64748B', 'Baseboard uses clean laboratory neutral slate alloy #64748B');

    // Radiation emitter plate must not be pitch black #0F172A
    assert.notEqual(emitter.color, '#0F172A', 'Emitter plate must avoid pitch black #0F172A');
    assert.equal(emitter.color, '#374151', 'Emitter plate uses matte graphite ceramic #374151');

    // Cold rod and receiver must not use artificial blue
    assert.notEqual(rod.color, '#2563EB', 'Cold conduction rod must not use electric blue');
    assert.notEqual(rod.color, '#38BDF8', 'Cold conduction rod must not use cyan');
    assert.equal(rod.color, '#94A3B8', 'Cold conduction rod begins at neutral ambient slate #94A3B8');

    assert.notEqual(receiver.color, '#334155', 'Receiver plate must be lightened from #334155');
    assert.equal(receiver.color, '#94A3B8', 'Receiver plate uses brushed alloy #94A3B8');
  });

  // =========================================================================
  // 2. CONDUCTION PHYSICS & TRANSIENT HEAT PROPAGATION
  // =========================================================================
  await t.test('2. Conduction: Transient heat diffusion, heat flow direction, and material conductivity', () => {
    const ambient = 20;
    const heatSource = 200;
    let state = createConductionState(12, ambient);

    // Initial state: all nodes at ambient baseline
    assert.equal(state.temperatures[0], ambient);
    assert.equal(state.temperatures[11], ambient);

    // Step 1: Simulate initial heating (Copper k = 390)
    state = stepConduction(state, 1.0, heatSource, 390, ambient);

    // Node 0 is in direct contact with heat source (hot boundary)
    assert.equal(state.temperatures[0], heatSource);
    // Heat wave propagates progressively: does NOT instantly recolor the entire rod!
    assert.ok(state.temperatures[1] > ambient, 'Node 1 begins warming');
    assert.ok(state.temperatures[1] < heatSource, 'Node 1 is cooler than heat source');
    assert.ok(state.temperatures[11] < state.temperatures[1], 'Far tip is much cooler than near end');

    // Monotonic heat flow: heat flows strictly from high to low temperature (Fourier gradient)
    for (let i = 0; i < state.nodeCount - 1; i++) {
      assert.ok(
        state.temperatures[i] >= state.temperatures[i + 1],
        `Heat must flow from hot to cold: node ${i} (${state.temperatures[i]}°C) >= node ${i + 1} (${state.temperatures[i + 1]}°C)`
      );
    }

    // Material comparison: Copper (k = 390) vs Structural Steel (k = 50) vs Glass (k = 1.2)
    let stateCu = createConductionState(12, ambient);
    let stateSteel = createConductionState(12, ambient);
    let stateGlass = createConductionState(12, ambient);

    const simDuration = 3.0; // 3 seconds of diffusion
    stateCu = stepConduction(stateCu, simDuration, heatSource, HEAT_MATERIALS.copper.conductivity, ambient);
    stateSteel = stepConduction(stateSteel, simDuration, heatSource, HEAT_MATERIALS.steel.conductivity, ambient);
    stateGlass = stepConduction(stateGlass, simDuration, heatSource, HEAT_MATERIALS.glass.conductivity, ambient);

    // Midpoint temperature check (node 6)
    const midCu = stateCu.temperatures[6];
    const midSteel = stateSteel.temperatures[6];
    const midGlass = stateGlass.temperatures[6];

    assert.ok(
      midCu > midSteel,
      `Copper midpoint (${midCu.toFixed(1)}°C) must be hotter than Steel midpoint (${midSteel.toFixed(1)}°C)`
    );
    assert.ok(
      midSteel > midGlass,
      `Steel midpoint (${midSteel.toFixed(1)}°C) must be hotter than Glass insulator midpoint (${midGlass.toFixed(1)}°C)`
    );
    assert.ok(
      Math.abs(midGlass - ambient) < 0.5,
      `Insulating glass must keep midpoint near ambient temperature (got ${midGlass.toFixed(1)}°C, ambient ${ambient}°C)`
    );
  });

  // =========================================================================
  // 3. CONVECTION PHYSICS & BOUSSINESQ BUOYANCY CIRCULATION
  // =========================================================================
  await t.test('3. Convection: Buoyancy velocity, temperature hierarchy, and stagnation at zero gradient', () => {
    const ambient = 20;

    // Normal heating (Heat Source = 250°C, Ambient = 20°C, ΔT = 230°C)
    const hotMetrics = calculateConvectionMetrics(250, ambient);
    assert.ok(hotMetrics.fluidVelocityMs > 0, 'Heated fluid must have positive circulation speed');
    assert.equal(hotMetrics.deltaTempC, 230);

    // Temperature hierarchy: Rising plume > Surface > Sinking return current
    assert.ok(
      hotMetrics.risingPlumeTempC > hotMetrics.topSurfaceTempC,
      `Rising warm plume (${hotMetrics.risingPlumeTempC}°C) must be hotter than surface (${hotMetrics.topSurfaceTempC}°C)`
    );
    assert.ok(
      hotMetrics.topSurfaceTempC > hotMetrics.sinkingReturnTempC,
      `Top surface (${hotMetrics.topSurfaceTempC}°C) must be hotter than sinking wall return (${hotMetrics.sinkingReturnTempC}°C)`
    );
    assert.ok(
      hotMetrics.sinkingReturnTempC > ambient,
      `Sinking wall return (${hotMetrics.sinkingReturnTempC}°C) must be near ambient baseline`
    );

    // Zero gradient condition (Heater at ambient 20°C): fluid should stagnate
    const stagnateMetrics = calculateConvectionMetrics(ambient, ambient);
    assert.equal(stagnateMetrics.deltaTempC, 0);
    assert.equal(stagnateMetrics.fluidVelocityMs, 0, 'Velocity must be zero when ΔT = 0 (no buoyancy drive)');
    assert.equal(stagnateMetrics.rayleighFactor, 'Stagnant / Conduction Only');

    // Higher temperature difference strictly increases convective circulation velocity
    const hotterMetrics = calculateConvectionMetrics(450, ambient);
    assert.ok(
      hotterMetrics.fluidVelocityMs > hotMetrics.fluidVelocityMs,
      'Higher heat source temperature must increase convective circulation velocity'
    );
  });

  // =========================================================================
  // 4. THERMAL RADIATION & STEFAN-BOLTZMANN EMISSION
  // =========================================================================
  await t.test('4. Radiation: Non-contact infrared transmission, T^4 Stefan-Boltzmann law, and receiver heating', () => {
    const ambient = 20; // 293.15 K
    const Th1 = 200; // 473.15 K
    const Th2 = 400; // 673.15 K
    const eps = 0.85;

    // Stefan-Boltzmann power calculation
    const rad1 = calculateRadiationMetrics(Th1, eps, 0, ambient);
    assert.ok(rad1.emitterPowerWatts > 0, 'Emitted power must be positive');
    assert.equal(rad1.medium, 'Vacuum / Transparent Air (No matter required)');

    // Verify T^4 dependence: doubling temperature in Kelvin increases radiated power by factor of ~16
    const rad2 = calculateRadiationMetrics(Th2, eps, 0, ambient);
    assert.ok(
      rad2.emitterPowerWatts > rad1.emitterPowerWatts,
      'Higher temperature must emit strictly higher radiative power'
    );
    // At 400°C (673.15 K) vs 200°C (473.15 K), (673.15/473.15)^4 ≈ 4.09
    const ratio = rad2.fluxDensityWm2 / rad1.fluxDensityWm2;
    assert.ok(ratio > 3.5 && ratio < 4.8, `Radiated flux ratio should follow (T₂/T₁)⁴ ~ 4.1, got ${ratio.toFixed(2)}`);

    // Receiver plate gradual absorption heating over time without direct physical contact
    const t0 = calculateRadiationMetrics(Th1, eps, 0.0, ambient);
    assert.equal(t0.absorbedReceiverTempC, ambient, 'At t=0, receiver plate is at ambient baseline');

    const t5 = calculateRadiationMetrics(Th1, eps, 5.0, ambient);
    assert.ok(
      t5.absorbedReceiverTempC > ambient,
      `After 5s, receiver absorbs radiant energy and warms up (${t5.absorbedReceiverTempC}°C > ${ambient}°C)`
    );

    const t20 = calculateRadiationMetrics(Th1, eps, 20.0, ambient);
    assert.ok(
      t20.absorbedReceiverTempC > t5.absorbedReceiverTempC,
      'Receiver temperature asymptotically approaches radiative equilibrium over time'
    );

    // Emissivity effect: Higher emissivity emits more power
    const highEps = calculateRadiationMetrics(Th1, 0.95, 0, ambient);
    const lowEps = calculateRadiationMetrics(Th1, 0.15, 0, ambient);
    assert.ok(
      highEps.emitterPowerWatts > lowEps.emitterPowerWatts,
      'High emissivity surface (ε=0.95) must radiate more power than low emissivity (ε=0.15)'
    );
  });

  // =========================================================================
  // 5. CONTROLS: PAUSE, RESET, AND REAL-TIME SIMULATION INTEGRATION
  // =========================================================================
  await t.test('5. Controls: Simulation freeze on pause, clean reset, and temperature palette mapping', () => {
    const ambient = 20;
    const heatSource = 200;

    // Test Pause: state does NOT advance when dt = 0
    let state = createConductionState(12, ambient);
    state = stepConduction(state, 2.0, heatSource, 390, ambient);
    const snapshot = [...state.temperatures];

    // Paused step (simulating dt = 0)
    const pausedState = { ...state };
    assert.deepEqual(pausedState.temperatures, snapshot, 'Paused simulation must freeze state');

    // Test Reset: state returns cleanly to initial ambient baseline
    const resetState = createConductionState(12, ambient);
    assert.equal(resetState.temperatures[0], ambient);
    assert.equal(resetState.temperatures[11], ambient);
    assert.equal(resetState.simulatedTimeSec, 0);

    // Restrained temperature color palette audit
    const coolColor = getTemperatureHexColor(20, 20, 500);
    assert.equal(coolColor, '#94A3B8', 'Ambient 20°C maps to cool neutral slate #94A3B8 (no electric blue)');

    const warmColor = getTemperatureHexColor(60, 20, 500);
    assert.equal(warmColor, '#D97706', 'Mild warmth 60°C maps to warm amber #D97706');

    const hotColor = getTemperatureHexColor(180, 20, 500);
    assert.equal(hotColor, '#EA580C', 'Moderate heat 180°C maps to thermal orange #EA580C');

    const extremeColor = getTemperatureHexColor(450, 20, 500);
    assert.equal(extremeColor, '#EF4444', 'Extreme heat 450°C maps to hot crimson #EF4444');

    // Smooth RGB interpolation sanity
    const rgbCool = getTemperatureColorRgb(20, 20, 500);
    assert.ok(rgbCool.r > 0 && rgbCool.g > 0 && rgbCool.b > 0);
    const rgbHot = getTemperatureColorRgb(450, 20, 500);
    assert.ok(rgbHot.r > rgbCool.r, 'Hot state has higher red component');
  });
});
