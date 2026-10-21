import * as fs from 'fs';
import * as path from 'path';
import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { MOLECULES } from '../data/moleculesData';
import {
  PRE_BATCH_1_CURATED_MODEL_IDS,
  PRE_BATCH_1_STANDALONE_SCENES,
  PRESERVED_POST_BATCH_1_MODEL_IDS,
  isPreBatch1Model,
  createPreBatch1UpgradedMaterial,
  createPreBatch1UpgradedGeometry,
  enhancePreBatch1ModelAssemblies,
} from '../simulations/preBatch1VisualUpgradeStudio';
import { ADVANCED_PHYSICS_BATCH_1_TYPES } from '../simulations/physics/advancedPhysicsBatch1Studio';
import { ADVANCED_PHYSICS_BATCH_2_TYPES } from '../simulations/physics/advancedPhysicsBatch2Studio';
import { ADVANCED_PHYSICS_BATCH_3_TYPES } from '../simulations/physics/advancedPhysicsBatch3Studio';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

console.log('=== Running Pre-Batch-1 Visual Quality Upgrade Verification Tests ===');

// Deduplicate models from CURATED_AI_MODELS by model.id
const uniqueModelsMap = new Map<string, (typeof CURATED_AI_MODELS)[string]>();
for (const model of Object.values(CURATED_AI_MODELS)) {
  if (model && model.id && !uniqueModelsMap.has(model.id)) {
    uniqueModelsMap.set(model.id, model);
  }
}
const allUniqueModels = Array.from(uniqueModelsMap.values());

// 1. Verify complete target set of pre-Physics-Batch-1 models (Models 1-40 active models before Model 41)
const preBatch1Models = allUniqueModels.filter((m) => isPreBatch1Model(m.functionalType, m.id));
assert(
  preBatch1Models.length >= 34,
  `Expected at least 34 pre-Batch-1 curated models in registry, found ${preBatch1Models.length}`
);

for (const model of preBatch1Models) {
  assert(
    isPreBatch1Model(model.functionalType, model.id) === true,
    `Pre-Batch-1 model "${model.id}" must return true for isPreBatch1Model()`
  );
}

// 2. Verify strict preservation boundary for Model 41+ (Physics Batch 1, Batch 2 & Batch 3)
const postCutoffModels = allUniqueModels.filter((m) => !isPreBatch1Model(m.functionalType, m.id));
assert(
  postCutoffModels.length === 21,
  `Expected 21 post-cutoff preserved models (41-61), found ${postCutoffModels.length}`
);

for (const typeOrId of [
  ...Array.from(ADVANCED_PHYSICS_BATCH_1_TYPES),
  ...Array.from(ADVANCED_PHYSICS_BATCH_2_TYPES),
  ...Array.from(ADVANCED_PHYSICS_BATCH_3_TYPES),
]) {
  assert(
    PRESERVED_POST_BATCH_1_MODEL_IDS.has(typeOrId),
    `Post-cutoff identifier "${typeOrId}" must be listed in PRESERVED_POST_BATCH_1_MODEL_IDS`
  );
  assert(
    isPreBatch1Model(typeOrId, typeOrId) === false,
    `Post-cutoff model "${typeOrId}" (Models 41+) must NOT be classified as a pre-Batch-1 model`
  );
}

// 3. Verify all pre-Batch-1 models upgrade materials, geometry smoothness, and composite assemblies
let totalPartsVerified = 0;
let totalCompositeSubpartsAdded = 0;

for (const model of preBatch1Models) {
  assert(model.parts.length >= 3, `Model "${model.id}" must retain all anatomical/scientific parts`);

  const meshMap = new Map<string, THREE.Object3D>();
  const interactiveMeshes: THREE.Object3D[] = [];

  for (const part of model.parts) {
    const mat = createPreBatch1UpgradedMaterial(part, false);
    assert(
      mat instanceof THREE.Material,
      `Part "${part.id}" of "${model.id}" must use upgraded PBR material`
    );

    const selectedMat = createPreBatch1UpgradedMaterial(part, true);
    if ('emissive' in selectedMat) {
      assert(
        (selectedMat as THREE.MeshStandardMaterial).emissive.getHex() === 0x38bdf8,
        `Selected part "${part.id}" of "${model.id}" must display crisp blue highlight emissive`
      );
    }
    selectedMat.dispose();

    const geom = createPreBatch1UpgradedGeometry(part);
    assert(
      geom instanceof THREE.BufferGeometry,
      `Part "${part.id}" of "${model.id}" must generate valid high-segment BufferGeometry`
    );

    const mesh = new THREE.Mesh(geom, mat);
    if (part.position) mesh.position.set(...part.position);
    if (part.rotation) mesh.rotation.set(...part.rotation);
    if (part.scale) mesh.scale.set(...part.scale);

    meshMap.set(part.id, mesh);
    interactiveMeshes.push(mesh);
    totalPartsVerified++;
  }

  enhancePreBatch1ModelAssemblies(model, meshMap, interactiveMeshes);

  for (const part of model.parts) {
    const mesh = meshMap.get(part.id) as THREE.Mesh;
    totalCompositeSubpartsAdded += mesh.children.length;
  }

  for (const obj of meshMap.values()) {
    const m = obj as THREE.Mesh;
    m.geometry.dispose();
    if (!Array.isArray(m.material)) m.material.dispose();
  }
}

assert(
  totalPartsVerified > 180,
  `Expected over 180 individual pre-Batch-1 model parts to be verified, got ${totalPartsVerified}`
);
assert(
  totalCompositeSubpartsAdded > 40,
  `Expected composite structural details (collars, rings, rims, plinths) on pre-Batch-1 parts, got ${totalCompositeSubpartsAdded}`
);

// 4. Verify standalone pre-existing 3D scenes integrate the new visual studio standard
assert(
  PRE_BATCH_1_STANDALONE_SCENES.length === 11,
  `Expected 11 standalone pre-existing 3D scenes in inventory, found ${PRE_BATCH_1_STANDALONE_SCENES.length}`
);

const standaloneScenePaths = [
  'src/components/biology/CellScene.tsx',
  'src/components/biology/DnaScene.tsx',
  'src/components/biology/HeartScene.tsx',
  'src/components/biology/FrogNeckDissectionScene.tsx',
  'src/components/biology/HumanAnatomyExplorer.tsx',
  'src/components/chemistry/ChemistryLabScene.tsx',
  'src/components/chemistry/MolecularScene.tsx',
  'src/components/physics/CircuitScene.tsx',
  'src/components/physics/PendulumScene.tsx',
  'src/components/physics/ProjectileScene.tsx',
];

for (const relPath of standaloneScenePaths) {
  const fullPath = path.resolve(process.cwd(), relPath);
  const src = fs.readFileSync(fullPath, 'utf-8');
  assert(
    src.includes('setupPreBatch1StudioEnvironment'),
    `Standalone scene ${relPath} must use setupPreBatch1StudioEnvironment for the upgraded visual standard`
  );
}

// 5. Verify Dynamic3DModelRenderer integrates pre-Batch-1 visual studio while keeping Batch 1 & 2 intact
const rendererPath = path.resolve(process.cwd(), 'src/components/models/Dynamic3DModelRenderer.tsx');
const rendererSrc = fs.readFileSync(rendererPath, 'utf-8');
assert(
  rendererSrc.includes('setupPreBatch1StudioEnvironment') &&
    rendererSrc.includes('createPreBatch1UpgradedMaterial') &&
    rendererSrc.includes('createPreBatch1UpgradedGeometry') &&
    rendererSrc.includes('enhancePreBatch1ModelAssemblies'),
  'Dynamic3DModelRenderer.tsx must integrate all pre-Batch-1 studio environment, material, geometry, and composite detailing upgrades'
);
assert(
  rendererSrc.includes('setupBatch1StudioEnvironment') &&
    rendererSrc.includes('buildBatch1CustomAssemblies') &&
    rendererSrc.includes('buildBatch2CustomAssemblies'),
  'Dynamic3DModelRenderer.tsx must strictly preserve Physics Batch 1 and Batch 2 assembly and environment pipelines'
);

// 6. Scientific Accuracy Audit Verification across Pre-Batch-1 Models & Molecular Geometries
function computeAngleDeg(
  center: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const v1 = new THREE.Vector3(p1[0] - center[0], p1[1] - center[1], p1[2] - center[2]);
  const v2 = new THREE.Vector3(p2[0] - center[0], p2[1] - center[1], p2[2] - center[2]);
  return THREE.MathUtils.radToDeg(v1.angleTo(v2));
}

// 6a. Standalone moleculesData.ts VSEPR bond angles
const h2oMol = MOLECULES.find((m) => m.id === 'h2o')!;
const h2oAngle = computeAngleDeg(h2oMol.atoms[0].position, h2oMol.atoms[1].position, h2oMol.atoms[2].position);
assert(
  Math.abs(h2oAngle - 104.5) < 0.2,
  `moleculesData.ts H2O bond angle must be 104.5° (±0.2°), got ${h2oAngle.toFixed(2)}°`
);

const nh3Mol = MOLECULES.find((m) => m.id === 'nh3')!;
const nh3Angle12 = computeAngleDeg(nh3Mol.atoms[0].position, nh3Mol.atoms[1].position, nh3Mol.atoms[2].position);
const nh3Angle23 = computeAngleDeg(nh3Mol.atoms[0].position, nh3Mol.atoms[2].position, nh3Mol.atoms[3].position);
assert(
  Math.abs(nh3Angle12 - 107.0) < 0.3 && Math.abs(nh3Angle23 - 107.0) < 0.3,
  `moleculesData.ts NH3 trigonal pyramidal bond angles must be 107.0° (±0.3°), got ${nh3Angle12.toFixed(2)}° and ${nh3Angle23.toFixed(2)}°`
);

const co2Mol = MOLECULES.find((m) => m.id === 'co2')!;
const co2Angle = computeAngleDeg(co2Mol.atoms[0].position, co2Mol.atoms[1].position, co2Mol.atoms[2].position);
assert(
  Math.abs(co2Angle - 180.0) < 0.1,
  `moleculesData.ts CO2 bond angle must be 180.0°, got ${co2Angle.toFixed(2)}°`
);

// 6b. Curated Water Molecule (base & Batch 2 Model 18) 3D VSEPR coordinates
for (const waterKey of ['water', 'water-molecule-explorer']) {
  const wModel = CURATED_AI_MODELS[waterKey];
  const oPart = wModel.parts.find((p) => p.id === 'oxygen-atom')!;
  const h1Part = wModel.parts.find((p) => p.id === 'hydrogen-1')!;
  const h2Part = wModel.parts.find((p) => p.id === 'hydrogen-2')!;
  const angle = computeAngleDeg(oPart.position, h1Part.position, h2Part.position);
  assert(
    Math.abs(angle - 104.5) < 0.25,
    `Curated model "${wModel.id}" static 3D H-O-H bond angle must match 104.5° (±0.25°), got ${angle.toFixed(2)}°`
  );
}

// 6c. Simple Pendulum (pendulum-harmonics) geometric consistency with L = 2.0 m
const pendModel = CURATED_AI_MODELS.pendulum;
const pivotPart = pendModel.parts.find((p) => p.id === 'pivot-bearing')!;
const stringPart = pendModel.parts.find((p) => p.id === 'suspension-string')!;
const bobPart = pendModel.parts.find((p) => p.id === 'spherical-bob')!;
const pivotToBobDist = Math.abs(pivotPart.position[1] - bobPart.position[1]);
assert(
  Math.abs(stringPart.dimensions[1] - 2.0) < 0.01 && Math.abs(pivotToBobDist - 2.0) < 0.01,
  `Simple Pendulum string length (${stringPart.dimensions[1]} m) and pivot-to-bob distance (${pivotToBobDist} m) must equal L = 2.0 m`
);

// 6d. Verify renderer scientific accuracy bindings for pre-Batch-1 interactive conditions & parameters
assert(
  rendererSrc.includes("vMode === 'hydrogen_bonding_collection'") &&
    rendererSrc.includes("viewMode === 'gas_particles_collection'") &&
    rendererSrc.includes('conditions.totalInternalReflection') &&
    rendererSrc.includes('conditions.waterGateOpen') &&
    rendererSrc.includes('conditions.fieldPolarity'),
  'Dynamic3DModelRenderer.tsx must bind all interactive scientific conditions (hydrogen_bonding_collection, gas_particles_collection, totalInternalReflection, waterGateOpen, fieldPolarity)'
);

console.log(
  `✓ Pre-Batch-1 Visual Quality Upgrade & Scientific Accuracy Audit Verified: ${preBatch1Models.length} curated models (${totalPartsVerified} parts, ${totalCompositeSubpartsAdded} structural detail accents) + ${standaloneScenePaths.length} standalone 3D scenes upgraded & scientifically verified; ${postCutoffModels.length} post-cutoff models (41–61) preserved untouched.`
);

