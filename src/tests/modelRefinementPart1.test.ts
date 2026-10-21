import test from 'node:test';
import assert from 'node:assert';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';

test('TECH-ANATOMIX — Model Refinement Part 1 Verification Suite', async (t) => {
  await t.test('1. Hydraulic Lift: Color correction, distinct materials, and amber mineral oil', () => {
    const lift = CURATED_AI_MODELS.hydraulicLift;
    assert.ok(lift, 'Hydraulic lift model must exist');
    assert.strictEqual(lift.id, 'hydraulic-lift');
    assert.strictEqual(lift.functionalType, 'hydraulic-lift');

    const base = lift.parts.find((p) => p.id === 'machine-base');
    const inputCyl = lift.parts.find((p) => p.id === 'input-cylinder');
    const inputPiston = lift.parts.find((p) => p.id === 'input-piston');
    const outputCyl = lift.parts.find((p) => p.id === 'output-cylinder');
    const outputPiston = lift.parts.find((p) => p.id === 'output-piston');
    const fluid = lift.parts.find((p) => p.id === 'hydraulic-fluid');
    const pipe = lift.parts.find((p) => p.id === 'fluid-pipe');

    assert.ok(base && inputCyl && inputPiston && outputCyl && outputPiston && fluid && pipe);

    // Verify excessively dark colors have been lightened
    assert.notStrictEqual(base.color, '#334155', 'Machine base must be lightened from excessively dark #334155');
    assert.strictEqual(base.color, '#94A3B8', 'Machine base uses clean structural neutral grey #94A3B8');

    assert.notStrictEqual(inputCyl.color, '#64748B', 'Input cylinder must be lightened');
    assert.strictEqual(inputCyl.color, '#E2E8F0', 'Input cylinder uses precision machined silver-grey #E2E8F0');

    assert.strictEqual(outputCyl.color, '#CBD5E1', 'Output cylinder uses light structural alloy #CBD5E1');

    // Verify blue is not the dominant component color
    assert.notStrictEqual(outputPiston.color, '#2563EB', 'Output piston must not use interface blue #2563EB');
    assert.strictEqual(outputPiston.color, '#F8FAFC', 'Output piston uses polished precision chrome steel #F8FAFC');

    // Verify hydraulic fluid is realistic amber mineral oil, not blue
    assert.notStrictEqual(fluid.color, '#0284C7', 'Hydraulic fluid must not use artificial blue');
    assert.strictEqual(fluid.color, '#F59E0B', 'Hydraulic fluid uses realistic golden amber mineral oil #F59E0B');
    assert.strictEqual(fluid.material, 'liquid');

    // Input piston uses restrained warm industrial bronze/amber
    assert.strictEqual(inputPiston.color, '#D97706');

    // Distinct materials
    assert.notStrictEqual(inputCyl.color, outputCyl.color);
    assert.notStrictEqual(inputPiston.color, outputPiston.color);
  });

  await t.test('2. Four-Stroke Engine: Color correction and distinguishable components', () => {
    const engine = BATCH_3_MODELS.fourStrokeEngine;
    assert.ok(engine, 'Four-Stroke Engine model must exist');
    assert.strictEqual(engine.id, 'four-stroke-engine');
    assert.strictEqual(engine.functionalType, 'four-stroke-engine');

    const block = engine.parts.find((p) => p.id === 'engine-cylinder-block');
    const piston = engine.parts.find((p) => p.id === 'reciprocating-piston');
    const rod = engine.parts.find((p) => p.id === 'connecting-rod');
    const crank = engine.parts.find((p) => p.id === 'crankshaft-journal');
    const intakeV = engine.parts.find((p) => p.id === 'intake-valve-poppet');
    const exhaustV = engine.parts.find((p) => p.id === 'exhaust-valve-poppet');
    const spark = engine.parts.find((p) => p.id === 'spark-plug-igniter');

    assert.ok(block && piston && rod && crank && intakeV && exhaustV && spark);

    // Verify block is lightened from #334155
    assert.notStrictEqual(block.color, '#334155', 'Engine block must be lightened');
    assert.strictEqual(block.color, '#94A3B8', 'Engine block uses light cast-aluminum #94A3B8');

    // Verify piston is bright precision machined silver
    assert.strictEqual(piston.color, '#F1F5F9');

    // Verify connecting rod is distinct forged chromoly steel
    assert.strictEqual(rod.color, '#A8A29E');

    // Verify crankshaft journal is distinct precision turned steel
    assert.strictEqual(crank.color, '#CBD5E1');

    // Verify intake valve is not neon blue
    assert.notStrictEqual(intakeV.color, '#38BDF8', 'Intake valve must avoid bright blue');
    assert.strictEqual(intakeV.color, '#E2E8F0', 'Intake valve uses polished austenitic steel #E2E8F0');

    // Verify exhaust valve uses restrained stellite alloy
    assert.strictEqual(exhaustV.color, '#BE123C');

    // All mechanical components are visually distinguishable
    const partColors = [block.color, piston.color, rod.color, crank.color, intakeV.color, exhaustV.color];
    assert.ok(new Set(partColors).size >= 5, 'Components must have distinct identifiable tones');
  });

  await t.test('3. Prism: Scientific refraction, normal dispersion, and interactive controls', () => {
    const prism = CURATED_AI_MODELS.prismDispersion;
    assert.ok(prism, 'Prism dispersion model must exist');
    assert.strictEqual(prism.id, 'prism-dispersion');
    assert.strictEqual(prism.functionalType, 'prism-dispersion');

    const glassPrism = prism.parts.find((p) => p.id === 'triangular-prism');
    const whiteBeam = prism.parts.find((p) => p.id === 'white-beam');
    const lightSource = prism.parts.find((p) => p.id === 'light-source');
    const arrow = prism.parts.find((p) => p.id === 'incident-arrow');
    const redRay = prism.parts.find((p) => p.id === 'red-ray');
    const violetRay = prism.parts.find((p) => p.id === 'violet-ray');
    const orangeRay = prism.parts.find((p) => p.id === 'orange-ray');
    const yellowRay = prism.parts.find((p) => p.id === 'yellow-ray');
    const greenRay = prism.parts.find((p) => p.id === 'green-ray');
    const blueRay = prism.parts.find((p) => p.id === 'blue-ray');
    const screen = prism.parts.find((p) => p.id === 'spectral-screen');
    const patch = prism.parts.find((p) => p.id === 'spectrum-patch');

    assert.ok(glassPrism, 'Must have triangular-prism');
    assert.ok(whiteBeam, 'Must have incident white-beam');
    assert.ok(lightSource, 'Must have light-source');
    assert.ok(arrow, 'Must have incident-arrow showing beam direction');
    assert.ok(screen, 'Must have spectral-screen');
    assert.ok(patch, 'Must have spectrum-patch on screen');

    // 6 distinct spectral rays present
    assert.ok(redRay && orangeRay && yellowRay && greenRay && blueRay && violetRay, 'Must have all 6 ROYGBIV spectral rays');

    // Internal rays exist
    const intRed = prism.parts.find((p) => p.id === 'internal-red-ray');
    const intViolet = prism.parts.find((p) => p.id === 'internal-violet-ray');
    assert.ok(intRed && intViolet, 'Must show internal refraction inside prism');

    // Verify prism material
    assert.strictEqual(glassPrism.material, 'glass');
    assert.strictEqual(glassPrism.shape, 'cylinder', 'Prism uses 3-sided cylinder geometry');

    // Verify interactive parameters
    assert.ok(prism.parameters?.dispersionStrength, 'Must preserve dispersionStrength parameter');
    assert.ok(prism.parameters?.prismApexAngle, 'Must preserve prismApexAngle parameter');
    assert.ok(prism.parameters?.incidentAngle, 'Must provide interactive incidentAngle parameter');
    assert.strictEqual(prism.parameters?.incidentAngle?.defaultValue, 45);
  });
});
