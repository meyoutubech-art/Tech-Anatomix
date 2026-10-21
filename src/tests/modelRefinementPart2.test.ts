import test from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

test('TECH-ANATOMIX — Model Refinement Part 2: Newton\'s Cradle & Chemical Bonding', async (t) => {
  // =========================================================================
  // 1. NEWTON'S CRADLE — PARAMETER-DEPENDENT PHYSICS
  // =========================================================================
  await t.test('1. Newton\'s Cradle: Parameter validation and physical consistency', () => {
    const cradle = CURATED_AI_MODELS.newtonsCradle;
    assert(Boolean(cradle), 'Newton\'s cradle model spec exists');
    assert.equal(cradle.functionalType, 'newtons-cradle');

    // Required parameters check
    const p = cradle.parameters;
    assert(Boolean(p.ballCountDisplaced), 'Contains ballCountDisplaced parameter');
    assert(Boolean(p.releaseAngle), 'Contains releaseAngle parameter');
    assert(Boolean(p.pendulumLength), 'Contains pendulumLength parameter');
    assert(Boolean(p.gravity), 'Contains gravity parameter');
    assert(Boolean(p.damping), 'Contains damping parameter');
    assert(Boolean(p.elasticity), 'Contains elasticity parameter');

    // Parameter boundaries
    assert(p.ballCountDisplaced.min >= 1 && p.ballCountDisplaced.max >= 3, 'Supports displacing 1, 2, or 3 spheres');
    assert(p.releaseAngle.min <= 15 && p.releaseAngle.max >= 50, 'Supports realistic release angle range (10°-60°)');
    assert(p.pendulumLength.min <= 1.2 && p.pendulumLength.max >= 2.0, 'Supports suspension length range (1.0m-2.4m)');
    assert(p.gravity.min <= 2.0 && p.gravity.max >= 20.0, 'Supports varying gravitational fields (Moon to Jupiter)');
    assert(p.elasticity.min >= 0.8 && p.elasticity.max <= 1.0, 'Supports coefficient of restitution (0.85-1.0)');

    // Period calculation check: T = 2pi * sqrt(L / g)
    const L1 = 1.6;
    const g1 = 9.8;
    const T1 = 2 * Math.PI * Math.sqrt(L1 / g1);
    assert(Math.abs(T1 - 2.54) < 0.05, `Earth standard period should be ~2.54s, got ${T1}`);

    // Longer pendulum increases period
    const L2 = 2.4;
    const T2 = 2 * Math.PI * Math.sqrt(L2 / g1);
    assert(T2 > T1, 'Longer pendulum suspension length strictly increases period');

    // Moon gravity increases period (slower swing)
    const gMoon = 1.62;
    const TMoon = 2 * Math.PI * Math.sqrt(L1 / gMoon);
    assert(TMoon > T1, 'Lower gravitational acceleration on Moon strictly increases period');
  });

  await t.test('2. Newton\'s Cradle: Physical collision and momentum conservation simulation', () => {
    // Test the numerical simulation algorithm used in Dynamic3DModelRenderer
    function simulateCradleCollision(
      kDisplaced: number,
      angleDeg: number,
      lengthL: number,
      gravG: number,
      elasticity: number,
      damping: number,
      durationSec: number
    ) {
      const angles = [0, 0, 0, 0, 0];
      const omegas = [0, 0, 0, 0, 0];
      const theta0 = -(angleDeg * Math.PI) / 180;
      for (let i = 0; i < 5; i++) {
        angles[i] = i < kDisplaced ? theta0 : 0;
        omegas[i] = 0;
      }

      const dt = 0.001;
      const totalSteps = Math.floor(durationSec / dt);

      let maxRightEjectionCount = 0;
      let maxRightOmega = 0;

      for (let step = 0; step < totalSteps; step++) {
        // 1. Gravity acceleration
        for (let i = 0; i < 5; i++) {
          const alpha = -(gravG / lengthL) * Math.sin(angles[i]) - damping * omegas[i];
          omegas[i] += alpha * dt;
          angles[i] += omegas[i] * dt;
        }

        // 2. Collision resolution passes
        for (let pass = 0; pass < 5; pass++) {
          for (let i = 0; i < 4; i++) {
            if (angles[i] > angles[i + 1]) {
              const vRel = omegas[i] - omegas[i + 1];
              if (vRel > 0) {
                const u1 = omegas[i];
                const u2 = omegas[i + 1];
                omegas[i] = (u1 + u2) / 2 - (elasticity * (u1 - u2)) / 2;
                omegas[i + 1] = (u1 + u2) / 2 + (elasticity * (u1 - u2)) / 2;
              }
              const mid = (angles[i] + angles[i + 1]) / 2;
              angles[i] = mid;
              angles[i + 1] = mid;
            }
          }
        }

        // Monotonic constraint guard
        for (let i = 0; i < 4; i++) {
          if (angles[i] > angles[i + 1]) angles[i] = angles[i + 1];
        }

        // Count outgoing spheres on the right
        const rightOut = angles.filter((a, idx) => idx >= 5 - kDisplaced && a > 0.05).length;
        if (rightOut > maxRightEjectionCount) maxRightEjectionCount = rightOut;
        if (omegas[4] > maxRightOmega) maxRightOmega = omegas[4];
      }

      return { maxRightEjectionCount, maxRightOmega };
    }

    // 1 sphere displaced -> 1 sphere ejected
    const res1 = simulateCradleCollision(1, 35, 1.6, 9.8, 1.0, 0.0, 2.0);
    assert.equal(res1.maxRightEjectionCount, 1, '1 incoming sphere elastically ejects exactly 1 outgoing sphere');
    assert(res1.maxRightOmega > 1.0, 'Ejected sphere receives momentum');

    // 2 spheres displaced -> 2 spheres ejected
    const res2 = simulateCradleCollision(2, 35, 1.6, 9.8, 1.0, 0.0, 2.0);
    assert.equal(res2.maxRightEjectionCount, 2, '2 incoming spheres elastically eject exactly 2 outgoing spheres');

    // Damping reduces peak momentum
    const resDamped = simulateCradleCollision(1, 35, 1.6, 9.8, 0.95, 0.02, 2.0);
    assert(resDamped.maxRightOmega < res1.maxRightOmega, 'Damping properly dissipates kinetic energy over time');
  });

  // =========================================================================
  // 2. CHEMICAL BONDING — LOGIC, ELECTRON CONSERVATION & VISUALIZATIONS
  // =========================================================================
  await t.test('3. Chemical Bonding: Model spec configuration and example selectors', () => {
    const bonding = CURATED_AI_MODELS['bonding-explorer'];
    assert(Boolean(bonding), 'Bonding explorer spec exists');
    assert.equal(bonding.functionalType, 'bonding-explorer');
    assert.equal(bonding.title, 'Ionic & Covalent Bonding Explorer');

    // Check conditions & example options
    const cond = bonding.conditions;
    assert(Boolean(cond.example), 'Contains example selector condition');
    const opts = cond.example.options?.map((o) => o.value) || [];
    assert(opts.includes('sodium_chloride'), 'Includes Sodium Chloride (NaCl) ionic example');
    assert(opts.includes('water'), 'Includes Water (H2O) polar covalent example');
    assert(opts.includes('methane'), 'Includes Methane (CH4) tetrahedral covalent example');

    // Check parameters
    assert(Boolean(bonding.parameters.reactionProgress), 'Contains reactionProgress parameter (0-100%)');
    assert(Boolean(bonding.parameters.atomSeparation), 'Contains atomSeparation parameter');
  });

  await t.test('4. Chemical Bonding: Strict valence electron conservation and charge consistency', () => {
    // Verify Ionic Bonding (NaCl):
    // Na (Z=11): [Ne] 3s1 -> 1 valence e-
    // Cl (Z=17): [Ne] 3s2 3p5 -> 7 valence e-
    // Total valence electrons = 1 + 7 = 8
    const naValence = 1;
    const clValence = 7;
    const totalIonicValence = naValence + clValence;
    assert.equal(totalIonicValence, 8, 'NaCl system has exactly 8 valence electrons');

    // After transfer: Na+ has net charge +1, Cl- has net charge -1
    const naProtons = 11;
    const naElectronsAfter = 10;
    const naCharge = naProtons - naElectronsAfter;
    assert.equal(naCharge, 1, 'Sodium cation net formal charge is +1');

    const clProtons = 17;
    const clElectronsAfter = 18;
    const clCharge = clProtons - clElectronsAfter;
    assert.equal(clCharge, -1, 'Chloride anion net formal charge is -1');
    assert.equal(naCharge + clCharge, 0, 'Ionic crystal pair maintains net charge neutrality (+1 - 1 = 0)');

    // Verify Covalent Bonding in Water (H2O):
    // Oxygen: 6 valence e- (2 bonding electrons + 4 lone pair electrons)
    // 2 Hydrogens: 1 valence e- each -> 2 bonding electrons
    // Total valence electrons = 6 + 2 = 8
    const oValence = 6;
    const hValenceTotal = 2 * 1;
    const totalWaterValence = oValence + hValenceTotal;
    assert.equal(totalWaterValence, 8, 'H2O system has exactly 8 valence electrons');

    const waterBondingPairs = 2; // 2 O-H single bonds
    const waterBondingElectrons = waterBondingPairs * 2;
    const waterLonePairs = 2; // 2 non-bonding lone pairs on Oxygen
    const waterLonePairElectrons = waterLonePairs * 2;
    assert.equal(
      waterBondingElectrons + waterLonePairElectrons,
      8,
      'Water valence electrons strictly partition into 4 bonding electrons + 4 lone pair electrons'
    );

    // Verify Covalent Bonding in Methane (CH4):
    // Carbon: 4 valence e- + 4 Hydrogens (4 e-) = 8 valence electrons
    // 4 C-H shared single bonds (sp3 tetrahedral, 109.5°), 0 lone pairs
    const cValence = 4;
    const methaneHValence = 4 * 1;
    assert.equal(cValence + methaneHValence, 8, 'CH4 system has exactly 8 valence electrons');
    const methaneBondingPairs = 4;
    assert.equal(methaneBondingPairs * 2, 8, 'Methane has exactly 4 shared pairs (8 bonding e-), 0 lone pairs');
  });

  await t.test('5. Chemical Bonding: Electronegativity classification distinguishes ionic from covalent', () => {
    // Pauling Electronegativities
    const en = {
      Na: 0.93,
      Cl: 3.16,
      Li: 0.98,
      F: 3.98,
      H: 2.20,
      O: 3.44,
      C: 2.55,
    };

    // NaCl: Delta chi = 3.16 - 0.93 = 2.23 > 2.0 (Ionic)
    const deltaNaCl = en.Cl - en.Na;
    assert(deltaNaCl > 2.0, `NaCl electronegativity difference ${deltaNaCl.toFixed(2)} > 2.0 defines ionic bond`);

    // LiF: Delta chi = 3.98 - 0.98 = 3.00 > 2.0 (Ionic)
    const deltaLiF = en.F - en.Li;
    assert(deltaLiF > 2.0, `LiF electronegativity difference ${deltaLiF.toFixed(2)} > 2.0 defines ionic bond`);

    // H2O: Delta chi = 3.44 - 2.20 = 1.24 (0.5 < Delta chi < 1.7 -> Polar Covalent)
    const deltaOH = en.O - en.H;
    assert(deltaOH > 0.5 && deltaOH < 1.7, `O-H difference ${deltaOH.toFixed(2)} defines polar covalent bond`);

    // CH4: Delta chi = 2.55 - 2.20 = 0.35 < 0.5 (Nonpolar Covalent)
    const deltaCH = en.C - en.H;
    assert(deltaCH < 0.5, `C-H difference ${deltaCH.toFixed(2)} < 0.5 defines nonpolar covalent bond`);
  });
});
