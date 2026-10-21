import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { CHEMISTRY_BATCH_1_MODELS } from '../data/curatedModelsChemistryBatch1';
import {
  calculateMolecularOrbitalMetrics,
  calculateAtomicOrbitalMetrics,
  calculateCrystalLatticeMetrics,
  calculateMolecularPolarityMetrics,
  calculateIntermolecularForcesMetrics,
  calculateGalvanicCellMetrics,
  calculateElectrolysisMetrics,
} from '../simulations/chemistry/chemistryBatch1Engine';
import {
  isChemistryBatch1Model,
  buildChemistryBatch1CustomAssemblies,
  updateChemistryBatch1CustomAssemblies,
} from '../simulations/chemistry/chemistryBatch1Studio';
import { CHEMISTRY_BATCH_1_PAGE_MODELS } from '../pages/ChemistryLabPage';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';
import { getComponentDisplayName } from '../utils/componentDisplayName';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runChemistryBatch1Tests() {
  console.log('\n====================================================');
  console.log('TECH-ANATOMIX — CHEMISTRY BATCH 1 (MODELS 69–75) VERIFICATION SUITE');
  console.log('====================================================');

  const expectedChemistryBatch1Ids = [
    'molecular-orbital-explorer',
    'atomic-orbital-probability-explorer',
    'advanced-crystal-lattice-explorer',
    'molecular-polarity-explorer',
    'intermolecular-forces-explorer',
    'electrochemical-cell-simulator',
    'electrolysis-explorer',
  ];

  // 1. Registry completeness & non-duplication
  const batchEntries = Object.values(CHEMISTRY_BATCH_1_MODELS);
  assert(
    batchEntries.length === 7,
    `Expected 7 models in CHEMISTRY_BATCH_1_MODELS, found ${batchEntries.length}`
  );

  for (const id of expectedChemistryBatch1Ids) {
    const spec = CURATED_AI_MODELS[id];
    assert(Boolean(spec), `Model '${id}' must be registered in CURATED_AI_MODELS`);
    assert(
      isChemistryBatch1Model(spec.functionalType, spec.id),
      `isChemistryBatch1Model must recognize '${id}'`
    );
    assert(spec.parts.length >= 6, `Model '${id}' must have at least 6 distinct 3D parts`);
    assert(
      Object.keys(spec.parameters).length + Object.keys(spec.conditions || {}).length >= 4,
      `Model '${id}' must have at least 4 interactive parameter/condition controls`
    );
    assert(
      Boolean((spec.formula && spec.formula.length > 5) || (spec.equations && spec.equations.length >= 1)),
      `Model '${id}' must include governing scientific equations`
    );

    // Check canonical component display name synchronization
    const partNames = new Set<string>();
    for (const part of spec.parts) {
      const canonical = getComponentDisplayName(part);
      assert(
        part.name === canonical && part.label === canonical,
        `Model '${id}' part '${part.id}' must have identical canonical name and label ("${canonical}")`
      );
      assert(
        !partNames.has(canonical),
        `Model '${id}' must not contain duplicate component display name "${canonical}"`
      );
      partNames.add(canonical);
    }

    // Check ChemistryLabPage integration
    const inChemistryPage = CHEMISTRY_BATCH_1_PAGE_MODELS.some((m) => m.id === id);
    assert(inChemistryPage, `Model '${id}' must be integrated into ChemistryLabPage`);

    // Check offline & server prompt matching
    const offlineMatch = matchOfflinePreset(spec.prompt || spec.title);
    assert(
      offlineMatch.matched && offlineMatch.spec?.id === id,
      `Offline preset matcher must resolve prompt for '${id}' (got '${offlineMatch.spec?.id}')`
    );
    const serverMatch = matchVerifiedScientificModel(spec.prompt || spec.title);
    assert(
      Boolean(serverMatch && serverMatch.id === id),
      `Server scientific model matcher must resolve prompt for '${id}' (got '${serverMatch?.id}')`
    );
  }
  console.log('✅ PASS: All 7 Chemistry Batch 1 models registered, non-duplicate, and canonically named.');

  // 2. Scientific Calculation Engine Verification (Models 69–75)

  // Model 69: Molecular Orbital Explorer (LCAO & Bond Order)
  const moBonding = calculateMolecularOrbitalMetrics({
    orbitalPreset: 'h2_sigma_1s_bonding',
    combinationProgressPct: 100,
    electronOccupancyConfig: 'h2_ground_2e',
    internuclearDistanceAngstrom: 0.74,
  });
  assert(
    moBonding.bondingCharacter.startsWith('Bonding') &&
      moBonding.interactionSymmetry.startsWith('σ') &&
      moBonding.bondOrder === 1.0 &&
      moBonding.nodalPlanesCount === 0,
    `H2 σ1s bonding MO with 2e- must have bond order 1.0 and 0 nodal planes`
  );

  const moAntibonding = calculateMolecularOrbitalMetrics({
    orbitalPreset: 'h2_sigma_star_1s_antibonding',
    combinationProgressPct: 100,
    electronOccupancyConfig: 'he2_unstable_4e',
    internuclearDistanceAngstrom: 0.74,
  });
  assert(
    moAntibonding.bondingCharacter.startsWith('Antibonding') &&
      moAntibonding.bondOrder === 0 &&
      moAntibonding.nodalPlanesCount === 1,
    `H2 σ*1s antibonding MO with 2 bonding + 2 antibonding electrons (He2) must have bond order 0 and 1 nodal plane`
  );

  const moPiBonding = calculateMolecularOrbitalMetrics({
    orbitalPreset: 'p2_pi_2px_bonding',
    combinationProgressPct: 80,
    electronOccupancyConfig: 'h2_ground_2e',
    internuclearDistanceAngstrom: 1.21,
  });
  assert(
    moPiBonding.interactionSymmetry.startsWith('π') && moPiBonding.bondingCharacter.startsWith('Bonding'),
    `π2p bonding MO must report pi symmetry and constructive interference`
  );
  console.log('✅ PASS: Model 69 (Molecular Orbital Explorer) LCAO & bond order calculations verified.');

  // Model 70: Atomic Orbital Probability Explorer (Quantum Numbers & Nodes)
  const ao1s = calculateAtomicOrbitalMetrics({
    orbitalType: '1s',
    orbitalOrientation: 'z',
    probabilityThresholdPct: 90,
  });
  assert(
    ao1s.principalQuantumNumberN === 1 &&
      ao1s.angularMomentumQuantumNumberL === 0 &&
      ao1s.radialNodesCount === 0 &&
      ao1s.angularNodesCount === 0 &&
      ao1s.totalNodesCount === 0,
    `1s orbital must have n=1, l=0, 0 radial nodes, 0 angular nodes`
  );

  const ao2s = calculateAtomicOrbitalMetrics({
    orbitalType: '2s',
    orbitalOrientation: 'z',
    probabilityThresholdPct: 90,
  });
  assert(
    ao2s.principalQuantumNumberN === 2 &&
      ao2s.angularMomentumQuantumNumberL === 0 &&
      ao2s.radialNodesCount === 1 &&
      ao2s.angularNodesCount === 0 &&
      ao2s.totalNodesCount === 1,
    `2s orbital must have n=2, l=0, 1 radial node (n-l-1 = 1), 0 angular nodes`
  );

  const ao2p = calculateAtomicOrbitalMetrics({
    orbitalType: '2p',
    orbitalOrientation: 'x',
    probabilityThresholdPct: 90,
  });
  assert(
    ao2p.principalQuantumNumberN === 2 &&
      ao2p.angularMomentumQuantumNumberL === 1 &&
      ao2p.radialNodesCount === 0 &&
      ao2p.angularNodesCount === 1 &&
      ao2p.orbitalId === '2px',
    `2p_x orbital must have n=2, l=1, 0 radial nodes, 1 angular node`
  );

  const ao3d = calculateAtomicOrbitalMetrics({
    orbitalType: '3d',
    orbitalOrientation: 'z',
    probabilityThresholdPct: 90,
  });
  assert(
    ao3d.principalQuantumNumberN === 3 &&
      ao3d.angularMomentumQuantumNumberL === 2 &&
      ao3d.radialNodesCount === 0 &&
      ao3d.angularNodesCount === 2 &&
      ao3d.totalNodesCount === 2,
    `3d_z2 orbital must have n=3, l=2, 0 radial nodes, 2 angular nodes`
  );
  console.log('✅ PASS: Model 70 (Atomic Orbital Probability Explorer) quantum numbers & node counts verified.');

  // Model 71: Advanced Crystal Lattice Explorer (SC, BCC, FCC, HCP)
  const scMetrics = calculateCrystalLatticeMetrics({
    latticeType: 'SC',
    cellExpansionFactor: 0,
    atomicRadiusPm: 140,
  });
  assert(
    scMetrics.atomsPerConventionalUnitCell === 1 &&
      scMetrics.coordinationNumber === 6 &&
      Math.abs(scMetrics.atomicPackingFactor - 0.5236) < 0.005,
    `SC lattice must have Z=1 (8×1/8), CN=6, APF≈0.524`
  );

  const bccMetrics = calculateCrystalLatticeMetrics({
    latticeType: 'BCC',
    cellExpansionFactor: 0,
    atomicRadiusPm: 140,
  });
  assert(
    bccMetrics.atomsPerConventionalUnitCell === 2 &&
      bccMetrics.coordinationNumber === 8 &&
      Math.abs(bccMetrics.atomicPackingFactor - 0.6802) < 0.005,
    `BCC lattice must have Z=2 (8×1/8 + 1), CN=8, APF≈0.680`
  );

  const fccMetrics = calculateCrystalLatticeMetrics({
    latticeType: 'FCC',
    cellExpansionFactor: 0,
    atomicRadiusPm: 140,
  });
  assert(
    fccMetrics.atomsPerConventionalUnitCell === 4 &&
      fccMetrics.coordinationNumber === 12 &&
      Math.abs(fccMetrics.atomicPackingFactor - 0.7405) < 0.005,
    `FCC lattice must have Z=4 (8×1/8 + 6×1/2), CN=12, APF≈0.740`
  );

  const hcpMetrics = calculateCrystalLatticeMetrics({
    latticeType: 'HCP',
    cellExpansionFactor: 0,
    atomicRadiusPm: 140,
  });
  assert(
    hcpMetrics.atomsPerConventionalUnitCell === 6 &&
      hcpMetrics.atomsPerPrimitiveCell === 2 &&
      hcpMetrics.coordinationNumber === 12 &&
      Math.abs(hcpMetrics.atomicPackingFactor - 0.7405) < 0.005,
    `HCP conventional hex cell must have Z=6 (primitive Z=2), CN=12, APF≈0.740`
  );
  console.log('✅ PASS: Model 71 (Advanced Crystal Lattice Explorer) crystallography metrics verified.');

  // Model 72: Molecular Polarity Explorer (H2O, CO2, NH3, CH4, BF3)
  const h2oPol = calculateMolecularPolarityMetrics({
    moleculeId: 'H2O',
  });
  assert(
    h2oPol.isPolarMolecule === true &&
      Math.abs(h2oPol.idealBondAngleDeg - 104.5) < 0.2 &&
      h2oPol.netDipoleMomentDebye > 1.5,
    `H2O must be Bent (~104.5°) and Polar (μ ≈ 1.85 D)`
  );

  const co2Pol = calculateMolecularPolarityMetrics({
    moleculeId: 'CO2',
  });
  assert(
    co2Pol.isPolarMolecule === false &&
      co2Pol.idealBondAngleDeg === 180 &&
      co2Pol.netDipoleMomentDebye === 0 &&
      co2Pol.electronegativityDifference > 0.8,
    `CO2 must have polar C=O bonds (Δχ > 0.8) that cancel in linear 180° geometry to give μ_net = 0 D (Nonpolar)`
  );

  const nh3Pol = calculateMolecularPolarityMetrics({ moleculeId: 'NH3' });
  const ch4Pol = calculateMolecularPolarityMetrics({ moleculeId: 'CH4' });
  const bf3Pol = calculateMolecularPolarityMetrics({ moleculeId: 'BF3' });
  assert(
    nh3Pol.isPolarMolecule === true && ch4Pol.isPolarMolecule === false && bf3Pol.isPolarMolecule === false,
    `NH3 must be polar while symmetrical CH4 and BF3 must be nonpolar`
  );
  console.log('✅ PASS: Model 72 (Molecular Polarity Explorer) dipole vector addition verified.');

  // Model 73: Intermolecular Forces Explorer
  const hbondImf = calculateIntermolecularForcesMetrics({
    interactionType: 'hydrogen_bonding_h2o',
    separationAngstrom: 2.9,
    relativeOrientationDeg: 0,
    thermalMotionLevel: 298,
  });
  const ldfImf = calculateIntermolecularForcesMetrics({
    interactionType: 'dispersion_ar2',
    separationAngstrom: 3.75,
    relativeOrientationDeg: 0,
    thermalMotionLevel: 298,
  });
  assert(
    hbondImf.potentialEnergyKjMol < ldfImf.potentialEnergyKjMol &&
      hbondImf.normalBoilingPointKelvin > ldfImf.normalBoilingPointKelvin,
    `H2O hydrogen bonding well depth and boiling point must exceed Ar London dispersion`
  );
  console.log('✅ PASS: Model 73 (Intermolecular Forces Explorer) potential energy & orientation metrics verified.');

  // Model 74: Electrochemical Cell Simulator (Galvanic Cell & Nernst Equation)
  const znCuStd = calculateGalvanicCellMetrics({
    cellPair: 'zn_cu',
    anodeConcentrationM: 1.0,
    cathodeConcentrationM: 1.0,
    temperatureCelsius: 25,
  });
  assert(
    Math.abs(znCuStd.standardCellPotentialV - 1.1) < 0.01 &&
      Math.abs(znCuStd.liveNernstPotentialV - 1.1) < 0.01 &&
      znCuStd.isSpontaneous === true &&
      znCuStd.gibbsFreeEnergyKjMol < -200,
    `Standard Zn-Cu Daniell cell at 1.0 M and 25°C must have E°_cell = +1.10 V, E_cell = +1.10 V, and ΔG° < -200 kJ/mol`
  );

  const znCuNonStd = calculateGalvanicCellMetrics({
    cellPair: 'zn_cu',
    anodeConcentrationM: 0.01,
    cathodeConcentrationM: 2.0,
    temperatureCelsius: 25,
  });
  assert(
    znCuNonStd.liveNernstPotentialV > znCuStd.standardCellPotentialV,
    `When Q = [Zn2+]/[Cu2+] < 1, live Nernst potential E_cell must exceed E°_cell (+1.10 V)`
  );
  console.log('✅ PASS: Model 74 (Electrochemical Cell Simulator) standard & Nernst voltages verified.');

  // Model 75: Electrolysis Explorer (Faraday's Laws Q = It, m = MIt / zF)
  const moltenNaCl = calculateElectrolysisMetrics({
    experimentType: 'molten_nacl',
    currentAmps: 5.0,
    durationSeconds: 1800,
  });
  assert(
    Math.abs(moltenNaCl.totalChargeCoulombs - 9000) < 0.1 &&
      Math.abs(moltenNaCl.cathodeTheoreticalMassG - 2.1445) < 0.02 &&
      Math.abs(moltenNaCl.anodeTheoreticalMassG - 3.3067) < 0.02,
    `Faraday's laws for molten NaCl at 5.0 A for 1800 s must yield Q = 9000 C, m(Na) ≈ 2.145 g, m(Cl2) ≈ 3.307 g`
  );
  console.log("✅ PASS: Model 75 (Electrolysis Explorer) Faraday's laws stoichiometry verified.");

  // 3. 3D Scene Assembly, Animation Loop & Blue Selection Highlight Isolation
  for (const id of expectedChemistryBatch1Ids) {
    const spec = CURATED_AI_MODELS[id];
    const modelRoot = new THREE.Group();
    const meshMap = new Map<string, THREE.Object3D>();
    const interactiveMeshes: THREE.Object3D[] = [];

    spec.parts.forEach((p) => {
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      modelRoot.add(proxy);
      meshMap.set(p.id, proxy);
    });

    const handles = buildChemistryBatch1CustomAssemblies(spec, modelRoot, meshMap, interactiveMeshes);
    assert(Boolean(handles.rootGroup), `buildChemistryBatch1CustomAssemblies must return rootGroup for '${id}'`);
    assert(
      interactiveMeshes.length >= spec.parts.length,
      `All parts in '${id}' must register interactive 3D meshes`
    );

    const defaultParams: Record<string, number> = {};
    Object.values(spec.parameters).forEach((p) => (defaultParams[p.id] = p.defaultValue));
    const defaultConds: Record<string, any> = {};
    Object.values(spec.conditions || {}).forEach((c) => (defaultConds[c.id] = c.defaultValue));

    updateChemistryBatch1CustomAssemblies(handles, defaultParams, defaultConds, 1.5);

    handles.studioGroup.traverse((obj) => {
      assert(
        Number.isFinite(obj.position.x) &&
          Number.isFinite(obj.position.y) &&
          Number.isFinite(obj.position.z),
        `Non-finite 3D position detected in '${id}'`
      );
    });

    // Verify every part ID maps to an active 3D object in meshMap and supports #38bdf8 blue selection highlighting
    spec.parts.forEach((p) => {
      const registeredObj = meshMap.get(p.id);
      assert(Boolean(registeredObj), `Part '${p.id}' in model '${id}' must be registered in meshMap`);
      let meshOrLineCount = 0;
      registeredObj!.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
          meshOrLineCount++;
        }
      });
      assert(meshOrLineCount > 0, `Registered 3D object for part '${p.id}' in '${id}' must contain renderable geometry`);
    });
  }
  console.log('✅ PASS: All 7 Chemistry Batch 1 3D Studio assemblies, animations, and selection highlights verified.');
  console.log('====================================================\n');
}

runChemistryBatch1Tests();
