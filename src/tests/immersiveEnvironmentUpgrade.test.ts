import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import {
  IMMERSIVE_ENVIRONMENT_DESCRIPTORS,
  resolveModelEnvironmentDomain,
  buildDomainEnvironmentStageGroup,
  computeCameraAnglePosition,
  ImmersiveEnvironmentDomain,
} from '../utils/immersiveEnvironmentPreset';
import {
  buildModelPlayChallenge,
  CHEMISTRY_PLAY_EXPERIMENTS,
  ANATOMY_PLAY_MISSIONS,
  learnThroughPlayManager,
} from '../utils/learnThroughPlayEngine';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runImmersiveEnvironmentVerification(): {
  passed: number;
  details: string[];
} {
  const details: string[] = [];
  let passed = 0;

  // 1. Verify Phase 1: Complete removal of Gaming Arena files & routes (No new pages or sections constraint)
  const rootDir = process.cwd();
  const gamingDirExists = fs.existsSync(path.join(rootDir, 'src/gaming'));
  const gamingPageExists = fs.existsSync(path.join(rootDir, 'src/pages/GamingArenaPage.tsx'));
  assert(!gamingDirExists, 'src/gaming directory must be completely removed');
  assert(!gamingPageExists, 'src/pages/GamingArenaPage.tsx must be completely removed');
  passed += 2;
  details.push('Verified src/gaming and src/pages/GamingArenaPage.tsx are removed');

  const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
  const navbarSource = fs.readFileSync(path.join(rootDir, 'src/components/layout/Navbar.tsx'), 'utf8');
  const homeSource = fs.readFileSync(path.join(rootDir, 'src/pages/HomePage.tsx'), 'utf8');
  assert(!appSource.includes('GamingArenaPage') && !appSource.includes('gaming-arena'), 'App.tsx must not reference GamingArena');
  assert(!navbarSource.includes('gaming-arena'), 'Navbar.tsx must not reference gaming-arena');
  assert(!homeSource.includes('gaming-arena') && !homeSource.includes('Gaming Arena'), 'HomePage.tsx must not reference Gaming Arena');
  passed += 3;
  details.push('Verified App.tsx, Navbar.tsx, and HomePage.tsx have no separate Gaming Arena routes');

  // 2. Verify Phase 2: All 5 Immersive Environment Domains have complete descriptors and 3D stage builders
  const expectedDomains: ImmersiveEnvironmentDomain[] = [
    'physics-lab',
    'molecular-studio',
    'astronomy-space',
    'engineering-workbench',
    'biology-anatomy-studio',
  ];
  for (const domain of expectedDomains) {
    const desc = IMMERSIVE_ENVIRONMENT_DESCRIPTORS[domain];
    assert(Boolean(desc && desc.label && desc.shortBadge && desc.description), `Missing descriptor for ${domain}`);
    const stageGroup = buildDomainEnvironmentStageGroup(domain, -1.8, 3.6);
    assert(stageGroup instanceof THREE.Group, `Stage builder must return THREE.Group for ${domain}`);
    assert(stageGroup.children.length >= 2, `Stage group for ${domain} must contain 3D platform geometry`);
    passed += 2;
  }
  details.push('Verified all 5 Immersive Environment 3D stage builders and descriptors');

  // 3. Verify deterministic environment mapping across all 5 science domains
  const sampleSpecs = [
    { id: 'newton-cradle', title: "Newton's Cradle", concept: 'Physics Momentum Conservation', expected: 'physics-lab' },
    { id: 'vsepr-water', title: 'Water Molecule', concept: 'Chemistry Covalent Molecular Geometry', expected: 'molecular-studio' },
    { id: 'solar-system', title: 'Solar System Orbit', concept: 'Astronomy Planetary Astrophysics', expected: 'astronomy-space' },
    { id: 'four-stroke-engine', title: 'Four-Stroke Engine', concept: 'Mechanical Engineering Piston Crankshaft', expected: 'engineering-workbench' },
    { id: 'human-heart-anatomy', title: 'Human Heart Chamber', concept: 'Biology Medical Anatomy Dissection', expected: 'biology-anatomy-studio' },
  ] as const;

  for (const sample of sampleSpecs) {
    const domain = resolveModelEnvironmentDomain({
      id: sample.id,
      title: sample.title,
      concept: sample.concept,
    });
    assert(domain === sample.expected, `Expected ${sample.expected} for ${sample.id}, got ${domain}`);
    passed += 1;
  }
  details.push('Verified deterministic environment mapping across all 5 scientific domains');

  // 4. Verify camera angle preset math
  const defaultPos: [number, number, number] = [0, 2.2, 6.2];
  const target: [number, number, number] = [0, 0, 0];
  for (const angle of ['iso', 'front', 'top', 'side'] as const) {
    const result = computeCameraAnglePosition(angle, defaultPos, target);
    assert(
      Array.isArray(result.position) && result.position.length === 3 && result.position.every((n: number) => Number.isFinite(n)),
      `Camera position for ${angle} must be finite [x,y,z]`
    );
  }
  passed += 1;
  details.push('Verified 3D camera perspective preset coordinate computation (iso, front, top, side)');

  // 5. Verify Learn-Through-Play SEE -> TRY -> OBSERVE -> DISCOVER -> APPLY -> MASTER engine across curated models
  const curatedModelsList = Object.values(CURATED_AI_MODELS);
  assert(curatedModelsList.length >= 25, 'Curated scientific models registry must remain intact');
  for (const model of curatedModelsList.slice(0, 10)) {
    const challenge = buildModelPlayChallenge(model);
    assert(
      Boolean(challenge.modelId && challenge.visualActionCue && challenge.nonReaderVisualSummary && challenge.causeEffectRule),
      `Play challenge incomplete for ${model.id}`
    );
    assert(
      challenge.challengeTargetMin <= challenge.demoValue && challenge.demoValue <= challenge.challengeTargetMax,
      `Target range invalid for ${model.id}`
    );
    assert(challenge.spokenSeePrompt.length > 20, `Spoken accessibility prompt required for ${model.id}`);
    passed += 1;
  }
  assert(CHEMISTRY_PLAY_EXPERIMENTS.length >= 4, 'Must have at least 4 verified chemistry play experiments');
  assert(ANATOMY_PLAY_MISSIONS.length >= 4, 'Must have at least 4 verified anatomy play missions');
  const recorded = learnThroughPlayManager.recordDiscovery({
    id: 'test-discovery',
    domain: 'physics',
    title: 'Test Discovery',
    symbol: '⚡',
    formulaOrRule: 'F = m × a',
    scientificPrinciple: 'Force equals mass times acceleration.',
  });
  assert(Boolean(recorded && recorded.id === 'test-discovery'), 'learnThroughPlayManager.recordDiscovery must return DiscoveryRecord');
  passed += 3;
  details.push('Verified Learn-Through-Play 6-stage challenge builder, Chemistry experiments, Anatomy missions, and persistent Discovery log');

  return { passed, details };
}

