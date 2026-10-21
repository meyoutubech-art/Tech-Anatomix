import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { CHEMISTRY_BATCH_2_MODELS, CHEMISTRY_BATCH_2_MODEL_IDS } from '../data/curatedModelsChemistryBatch2';
import {
  calculateChemicalKineticsMetrics,
  calculateChemicalEquilibriumMetrics,
  calculateReactionEnergyProfileMetrics,
  calculateCatalysisMetrics,
  calculateTitrationMetrics,
  calculateSolubilityPrecipitationMetrics,
  calculateBufferSolutionMetrics,
} from '../simulations/chemistry/chemistryBatch2Engine';
import {
  isChemistryBatch2Model,
  buildChemistryBatch2CustomAssemblies,
  updateChemistryBatch2CustomAssemblies,
} from '../simulations/chemistry/chemistryBatch2Studio';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';
import { CHEMISTRY_BATCH_2_PAGE_MODELS } from '../pages/ChemistryLabPage';
import { getComponentDisplayName } from '../utils/componentDisplayName';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ChemistryBatch2Test] FAILED: ${message}`);
  }
}

export function runChemistryBatch2Tests() {
  console.log('\n====================================================');
  console.log('TECH-ANATOMIX — CHEMISTRY BATCH 2 (MODELS 76–82) VERIFICATION SUITE');
  console.log('====================================================');

  // 1. Registry & Uniqueness Verification
  const batchEntries = Object.values(CHEMISTRY_BATCH_2_MODELS);
  assert(
    batchEntries.length === 7,
    `Expected 7 models in CHEMISTRY_BATCH_2_MODELS, got ${batchEntries.length}`
  );
  assert(
    CHEMISTRY_BATCH_2_MODEL_IDS.length === 7,
    `Expected 7 Chemistry Batch 2 model IDs, got ${CHEMISTRY_BATCH_2_MODEL_IDS.length}`
  );

  const uniqueIds = new Set(CHEMISTRY_BATCH_2_MODEL_IDS);
  assert(uniqueIds.size === 7, 'All 7 Chemistry Batch 2 model IDs must be unique');

  for (const id of CHEMISTRY_BATCH_2_MODEL_IDS) {
    const spec = CURATED_AI_MODELS[id];
    assert(Boolean(spec), `Model ${id} missing from CURATED_AI_MODELS registry`);
    assert(spec.id === id, `Model ${id} id field mismatch`);
    assert(
      isChemistryBatch2Model(spec.functionalType, spec.id),
      `isChemistryBatch2Model(${spec.functionalType}, ${spec.id}) returned false`
    );
    assert(spec.parts.length >= 6, `Model ${id} must have >= 6 selectable 3D components`);
    assert(
      Object.keys(spec.parameters).length + Object.keys(spec.conditions || {}).length >= 5,
      `Model ${id} must have >= 5 interactive parameter/condition controls`
    );
    assert(
      Boolean((spec.formula && spec.formula.length > 5) || (spec.equations && spec.equations.length >= 1)),
      `Model ${id} must include governing formulas/equations`
    );
    assert(
      Boolean(spec.curiosityPrompts && spec.curiosityPrompts.length >= 3),
      `Model ${id} must include >= 3 curiosity prompts`
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
  }

  // 2. ChemistryLabPage Navigation Verification
  assert(
    CHEMISTRY_BATCH_2_PAGE_MODELS.length === 7,
    `Expected 7 models in CHEMISTRY_BATCH_2_PAGE_MODELS, got ${CHEMISTRY_BATCH_2_PAGE_MODELS.length}`
  );
  for (const id of CHEMISTRY_BATCH_2_MODEL_IDS) {
    assert(
      CHEMISTRY_BATCH_2_PAGE_MODELS.some((m) => m.id === id),
      `Model ${id} must be integrated into CHEMISTRY_BATCH_2_PAGE_MODELS`
    );
  }

  // 3. Offline & Server Prompt Matching Verification
  const sampleQueries: Record<string, string> = {
    'chemical-kinetics-simulator': 'Create a 3D Chemical Kinetics Simulator with Arrhenius rate constant',
    'chemical-equilibrium-explorer': 'Create a 3D Chemical Equilibrium Explorer demonstrating Le Chatelier and reaction quotient Q vs Kc',
    'reaction-energy-profile-explorer': 'Create a 3D Reaction Energy Profile Explorer with transition state and activation energy',
    'catalysis-explorer': 'Create a 3D Catalysis Explorer showing Langmuir-Hinshelwood adsorption on active sites',
    'acid-base-titration-laboratory': 'Create a 3D Acid-Base Titration Laboratory with graduated burette and equivalence point',
    'solubility-precipitation-explorer': 'Create a 3D Solubility and Precipitation Explorer comparing Qsp vs Ksp and common-ion effect',
    'buffer-solution-simulator': 'Create a 3D Buffer Solution Simulator using Henderson-Hasselbalch equation and buffer capacity',
  };

  for (const [expectedId, query] of Object.entries(sampleQueries)) {
    const matched = matchOfflinePreset(query);
    assert(
      Boolean(matched.matched && matched.spec?.id === expectedId),
      `Offline preset query "${query}" matched "${matched.spec?.id}" instead of "${expectedId}"`
    );
    const serverMatched = matchVerifiedScientificModel(query);
    assert(
      Boolean(serverMatched && serverMatched.id === expectedId),
      `Server verified model query "${query}" matched "${serverMatched?.id}" instead of "${expectedId}"`
    );
  }

  // 4. Mathematical & Scientific Engine Verification (Models 76–82)
  // Model 76: Chemical Kinetics Simulator
  const kinUncat = calculateChemicalKineticsMetrics({
    reactionModel: 'first_order_decomp',
    initialConcentrationM: 1.0,
    temperatureC: 25,
    catalystActive: false,
    elapsedScientificTimeSec: 20,
  });
  const kinCat = calculateChemicalKineticsMetrics({
    reactionModel: 'first_order_decomp',
    initialConcentrationM: 1.0,
    temperatureC: 25,
    catalystActive: true,
    elapsedScientificTimeSec: 20,
  });
  assert(kinCat.rateConstantK > kinUncat.rateConstantK, 'Catalyst must increase rate constant k via lower Ea');
  assert(kinCat.halfLifeSec < kinUncat.halfLifeSec, 'Catalyst must decrease half-life t1/2');
  assert(kinUncat.curvePoints.length >= 20, 'Kinetics curve must generate time series points');

  // Model 77: Chemical Equilibrium Explorer
  const eqBase = calculateChemicalEquilibriumMetrics({
    reactionPreset: 'haber_n2_h2_nh3',
    initialReactantAM: 1.0,
    initialReactantBM: 3.0,
    initialProductCM: 0.5,
    temperatureC: 180,
    vesselVolumeL: 1.0,
    disturbanceMode: 'none',
  });
  const eqAddReactant = calculateChemicalEquilibriumMetrics({
    reactionPreset: 'haber_n2_h2_nh3',
    initialReactantAM: 1.0,
    initialReactantBM: 3.0,
    initialProductCM: 0.5,
    temperatureC: 180,
    vesselVolumeL: 1.0,
    disturbanceMode: 'add_reactant',
  });
  assert(eqBase.equilibriumConstantKc > 0, 'Equilibrium constant Kc must be positive');
  assert(eqAddReactant.reactionQuotientQc !== eqBase.reactionQuotientQc, 'Disturbance must alter reaction quotient Qc');

  // Model 78: Reaction Energy Profile Explorer
  const epExo = calculateReactionEnergyProfileMetrics({
    profilePreset: 'exothermic_single_step',
    forwardActivationEnergyKjMol: 60,
    reactantEnergyKjMol: 50,
    productEnergyKjMol: 15,
    reactionCoordinateProgress: 0.5,
  });
  const epMulti = calculateReactionEnergyProfileMetrics({
    profilePreset: 'multistep_intermediate',
    forwardActivationEnergyKjMol: 60,
    reactantEnergyKjMol: 50,
    productEnergyKjMol: 20,
    reactionCoordinateProgress: 0.5,
  });
  assert(
    Math.abs(epExo.reverseActivationEnergyKjMol - (epExo.forwardActivationEnergyKjMol - epExo.enthalpyChangeDeltaHKjMol)) < 1e-4,
    'Thermodynamic identity Ea,rev = Ea,fwd - deltaH must hold'
  );
  assert(epMulti.isMultistep && epMulti.intermediateEnergyKjMol !== null, 'Multistep profile must include intermediate well');

  // Model 79: Catalysis Explorer
  const catHet = calculateCatalysisMetrics({
    catalystPreset: 'heterogeneous_pt_ethene',
    pathwayMode: 'catalysed',
    reactionStepIndex: 2,
    temperatureK: 300,
    catalysedBarrierReductionKjMol: 34,
  });
  assert(catHet.catalysedEaKjMol < catHet.uncatalysedEaKjMol, 'Catalyst must lower activation energy Ea');
  assert(catHet.arrheniusRateEnhancementFactor > 1, 'Catalyst must enhance reaction rate relative to uncatalyzed baseline');

  // Model 80: Acid-Base Titration Laboratory
  const titStrongEq = calculateTitrationMetrics({
    titrationType: 'strong_acid_strong_base',
    analyteVolumeMl: 25.0,
    analyteConcentrationM: 0.1,
    titrantConcentrationM: 0.1,
    titrantVolumeAddedMl: 25.0,
    indicatorType: 'phenolphthalein',
  });
  const titWeakHalf = calculateTitrationMetrics({
    titrationType: 'weak_acid_strong_base',
    analyteVolumeMl: 25.0,
    analyteConcentrationM: 0.1,
    titrantConcentrationM: 0.1,
    titrantVolumeAddedMl: 12.5,
    indicatorType: 'phenolphthalein',
  });
  const titWeakEq = calculateTitrationMetrics({
    titrationType: 'weak_acid_strong_base',
    analyteVolumeMl: 25.0,
    analyteConcentrationM: 0.1,
    titrantConcentrationM: 0.1,
    titrantVolumeAddedMl: 25.0,
    indicatorType: 'phenolphthalein',
  });
  assert(Math.abs(titStrongEq.currentPh - 7.0) < 0.05, `Strong acid + strong base equivalence pH should be 7.00, got ${titStrongEq.currentPh}`);
  assert(Math.abs(titWeakHalf.currentPh - 4.76) < 0.05, `Acetic acid half-equivalence pH should equal pKa (4.76), got ${titWeakHalf.currentPh}`);
  assert(titWeakEq.currentPh > 8.0, `Weak acid + strong base equivalence pH must be basic (> 8.0), got ${titWeakEq.currentPh}`);

  // Model 81: Solubility & Precipitation Explorer
  const solUnsat = calculateSolubilityPrecipitationMetrics({
    saltPreset: 'agcl',
    cationAddedMillimolar: 0.001,
    anionAddedMillimolar: 0.001,
    commonIonAddedMillimolar: 0,
    solutionVolumeMl: 100,
  });
  const solSupersat = calculateSolubilityPrecipitationMetrics({
    saltPreset: 'agcl',
    cationAddedMillimolar: 5.0,
    anionAddedMillimolar: 5.0,
    commonIonAddedMillimolar: 0,
    solutionVolumeMl: 100,
  });
  const solCommonIon = calculateSolubilityPrecipitationMetrics({
    saltPreset: 'agcl',
    cationAddedMillimolar: 5.0,
    anionAddedMillimolar: 5.0,
    commonIonAddedMillimolar: 5.0,
    solutionVolumeMl: 100,
  });
  assert(solUnsat.saturationStatus.includes('Unsaturated'), 'Low ion concentrations must be Unsaturated (Qsp < Ksp)');
  assert(solSupersat.saturationStatus.includes('Precipitation'), 'High ion concentrations must precipitate (Qsp > Ksp)');
  assert(
    solCommonIon.precipitateFormedMillimoles >= solSupersat.precipitateFormedMillimoles,
    'Common-ion addition must enhance precipitation and suppress remaining dissolved cation concentration'
  );
  assert(
    solCommonIon.equilibriumCationConcM < solSupersat.equilibriumCationConcM,
    'Common-ion addition must lower equilibrium cation concentration [Ag+]_eq'
  );

  // Model 82: Buffer Solution Simulator
  const bufEqual = calculateBufferSolutionMetrics({
    bufferPreset: 'acetate_buffer',
    initialWeakConcM: 0.2,
    initialConjugateConcM: 0.2,
    addedStrongAcidMmol: 0,
    addedStrongBaseMmol: 0,
    solutionVolumeMl: 100,
  });
  const bufAcidAdded = calculateBufferSolutionMetrics({
    bufferPreset: 'acetate_buffer',
    initialWeakConcM: 0.2,
    initialConjugateConcM: 0.2,
    addedStrongAcidMmol: 5.0,
    addedStrongBaseMmol: 0,
    solutionVolumeMl: 100,
  });
  assert(Math.abs(bufEqual.initialPh - 4.76) < 0.02, `Equimolar acetate buffer pH should equal pKa (4.76), got ${bufEqual.initialPh}`);
  assert(
    Math.abs(bufAcidAdded.deltaPh) < Math.abs(bufAcidAdded.unbufferedWaterPh - 7.0),
    'Buffer solution must resist pH change significantly better than unbuffered water'
  );

  // 5. 3D Scene Assembly & Animation Lifecycle Verification
  for (const id of CHEMISTRY_BATCH_2_MODEL_IDS) {
    const spec = CURATED_AI_MODELS[id];
    const sceneGroup = new THREE.Group();
    const meshMap: Record<string, THREE.Object3D> = {};
    const interactiveMeshes: THREE.Object3D[] = [];

    for (const part of spec.parts) {
      const dummyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      );
      dummyMesh.userData = { partId: part.id, partSpec: part };
      sceneGroup.add(dummyMesh);
      meshMap[part.id] = dummyMesh;
    }

    const handles = buildChemistryBatch2CustomAssemblies(spec, sceneGroup, meshMap, interactiveMeshes);
    assert(Boolean(handles && handles.modelId === id), `3D studio builder failed for ${id}`);
    assert(interactiveMeshes.length > 0, `Interactive meshes not populated for ${id}`);

    // Verify every declared part has visible 3D children attached and canonical partSpec metadata
    for (const part of spec.parts) {
      const partObj = meshMap[part.id];
      assert(Boolean(partObj), `Missing meshMap entry for part ${part.id} in ${id}`);
      assert(partObj.children.length > 0, `Part ${part.id} in ${id} has no custom 3D geometry children`);
    }

    // Run an animation & parameter update tick to verify zero runtime exceptions
    updateChemistryBatch2CustomAssemblies(handles!, {}, 0.5, 0.016);
  }

  console.log('✓ All Chemistry Batch 2 (Models 76–82) tests passed!');
}

runChemistryBatch2Tests();
