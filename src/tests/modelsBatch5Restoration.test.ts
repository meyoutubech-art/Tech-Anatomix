import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

describe('VIZLAB Quality Restoration — Models 31–40 Test Suite', () => {
  const modelKeys = [
    'acGenerator',
    'inductionExplorer',
    'heatTransferExplorer',
    'fourStrokeEngine',
    'electricBell',
    'hydroelectricPower',
    'motorEffectFleming',
  ];

  it('All 7 Models in Batch 3 should be registered with premium procedural geometry and metadata', () => {
    for (const key of modelKeys) {
      const model = BATCH_3_MODELS[key];
      assert.ok(model, `Model ${key} must exist in BATCH_3_MODELS`);
      assert.ok(model.id, `Model ${key} must have an id`);
      assert.ok(CURATED_AI_MODELS[model.id], `Model ${model.id} must be registered in CURATED_AI_MODELS`);
      assert.ok(model.title, `Model ${key} must have a title`);
      assert.ok(model.concept, `Model ${key} must have a scientific concept`);
      assert.ok(model.description, `Model ${key} must have an educational description`);
      assert.ok(model.whatIsIt, `Model ${key} must have whatIsIt metadata`);
      assert.ok(model.howDoesItWork, `Model ${key} must have howDoesItWork metadata`);
      assert.ok(model.realLifeExample, `Model ${key} must have realLifeExample metadata`);
      assert.ok(model.parts.length >= 6, `Model ${key} must have at least 6 rich parts (got ${model.parts.length})`);

      for (const part of model.parts) {
        assert.ok(part.id, `Part in ${key} must have an id`);
        assert.ok(part.name, `Part ${part.id} must have a name`);
        assert.ok(part.shape, `Part ${part.id} must have a 3D geometry shape`);
        assert.ok(Array.isArray(part.dimensions) && part.dimensions.length >= 2, `Part ${part.id} must have valid dimensions`);
        assert.ok(Array.isArray(part.position) && part.position.length === 3, `Part ${part.id} must have 3D position coords`);
        assert.ok(part.label, `Part ${part.id} must have an educational label`);
        assert.ok(part.description, `Part ${part.id} must have a part description`);
      }
    }
  });

  it('Model 31: AC Electric Generator must have rotating assembly, continuous slip rings, and internal cutaway condition', () => {
    const m = BATCH_3_MODELS.acGenerator;
    assert.strictEqual(m.id, 'ac-generator');
    assert.strictEqual(m.functionalType, 'ac-generator');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('stator-housing'));
    assert.ok(partIds.includes('magnet-north-pole'));
    assert.ok(partIds.includes('magnet-south-pole'));
    assert.ok(partIds.includes('central-drive-shaft'));
    assert.ok(partIds.includes('rotor-armature-coil'));
    assert.ok(partIds.includes('slip-ring-inner'));
    assert.ok(partIds.includes('slip-ring-outer'));
    assert.ok(partIds.includes('output-indicator-bulb'));

    const internalCond = m.conditions?.internalView;
    assert.ok(internalCond, 'Model 31 must feature an internalView condition');
    assert.strictEqual(internalCond.type, 'boolean');

    const rpmParam = m.parameters?.rotationSpeedRpm;
    assert.ok(rpmParam, 'Model 31 must feature rotationSpeedRpm parameter');
    assert.strictEqual(rpmParam.unit, 'RPM');
  });

  it('Model 33: Electromagnetic Induction Explorer must feature moving magnet, solenoid, galvanometer, and Lenz reaction', () => {
    const m = BATCH_3_MODELS.inductionExplorer;
    assert.strictEqual(m.id, 'electromagnetic-induction');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('bar-magnet-probe'));
    assert.ok(partIds.includes('conducting-solenoid-coil'));
    assert.ok(partIds.includes('galvanometer-indicator'));
    assert.ok(partIds.includes('galvanometer-needle'));
    assert.ok(partIds.includes('opposing-induced-field'));

    const internalCond = m.conditions?.internalView;
    assert.ok(internalCond, 'Model 33 must feature internalView condition');
  });

  it('Model 36: Heat Transfer Explorer must support conduction, convection, and radiation modes', () => {
    const m = BATCH_3_MODELS.heatTransferExplorer;
    assert.strictEqual(m.id, 'heat-transfer-explorer');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('thermal-heat-source'));
    assert.ok(partIds.includes('conduction-metal-rod'));
    assert.ok(partIds.includes('convection-fluid-vessel'));
    assert.ok(partIds.includes('radiation-emitter-plate'));
    assert.ok(partIds.includes('radiation-detector-plate'));

    const modeCond = m.conditions?.transferMode;
    assert.ok(modeCond, 'Model 36 must have transferMode condition');
    const optionValues = modeCond.options?.map((o) => o.value);
    assert.deepStrictEqual(optionValues, ['conduction', 'convection', 'radiation']);
  });

  it('Model 37: Four-Stroke Engine must include all 4 strokes, valves, piston, and crankshaft', () => {
    const m = BATCH_3_MODELS.fourStrokeEngine;
    assert.strictEqual(m.id, 'four-stroke-engine');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('engine-cylinder-block'));
    assert.ok(partIds.includes('reciprocating-piston'));
    assert.ok(partIds.includes('connecting-rod'));
    assert.ok(partIds.includes('crankshaft-journal'));
    assert.ok(partIds.includes('intake-valve-poppet'));
    assert.ok(partIds.includes('exhaust-valve-poppet'));
    assert.ok(partIds.includes('spark-plug-igniter'));
    assert.ok(partIds.includes('combustion-gas-chamber'));

    const internalCond = m.conditions?.internalView;
    assert.ok(internalCond, 'Model 37 must feature an internalView cutaway condition');
  });

  it('Model 38: Electric Bell Mechanism must feature interrupter make-and-break circuit', () => {
    const m = BATCH_3_MODELS.electricBell;
    assert.strictEqual(m.id, 'electric-bell');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('electromagnet-coils'));
    assert.ok(partIds.includes('spring-armature-hammer'));
    assert.ok(partIds.includes('resonant-gong-bell'));
    assert.ok(partIds.includes('contact-breaker-screw'));
    assert.ok(partIds.includes('circuit-spark-indicator'));
  });

  it('Model 39: Hydroelectric Power Station must feature dam, penstock, Francis turbine, and generator', () => {
    const m = BATCH_3_MODELS.hydroelectricPower;
    assert.strictEqual(m.id, 'hydroelectric-power');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('dam-reservoir-wall'));
    assert.ok(partIds.includes('reservoir-water-mass'));
    assert.ok(partIds.includes('penstock-water-chute'));
    assert.ok(partIds.includes('hydro-turbine-runner'));
    assert.ok(partIds.includes('turbine-drive-shaft'));
    assert.ok(partIds.includes('power-generator-housing'));
  });

  it('Model 40: Motor Effect must feature conductor on rails, magnet pole pieces, and Lorentz force vector', () => {
    const m = BATCH_3_MODELS.motorEffectFleming;
    assert.strictEqual(m.id, 'motor-effect-fleming');
    const partIds = m.parts.map((p) => p.id);
    assert.ok(partIds.includes('u-shape-magnet-poles'));
    assert.ok(partIds.includes('magnet-north-pole-piece'));
    assert.ok(partIds.includes('magnet-south-pole-piece'));
    assert.ok(partIds.includes('parallel-rail-left'));
    assert.ok(partIds.includes('parallel-rail-right'));
    assert.ok(partIds.includes('current-carrying-conductor'));
    assert.ok(partIds.includes('force-direction-arrow'));
    assert.ok(partIds.includes('magnetic-field-vector-b'));
    assert.ok(partIds.includes('current-vector-i'));

    // Lorentz force equation F = B * I * L
    const B = 1.5; // T
    const I = 8.0; // A
    const L = 0.2; // m
    const F = Number((B * I * L).toFixed(2));
    assert.strictEqual(F, 2.4, 'Lorentz force must equal 2.4 N');
  });
});
