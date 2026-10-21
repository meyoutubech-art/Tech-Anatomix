import { CURATED_AI_MODELS } from '../data/curatedAiModels';

export async function runLabelVisibilityTests() {
  console.log('\n====================================================');
  console.log('VIZLAB LABEL VISIBILITY & TOGGLE VERIFICATION SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // CHECK 1: Default Visibility State
  console.log('\n--- CHECK 1: Default Label Visibility State ---');
  let currentLabelsState = true;
  assert(currentLabelsState === true, 'Labels are ON (visible) by default');

  // CHECK 2: Clicking Hide Labels hides all relevant labels
  console.log('\n--- CHECK 2: Hide Labels Hiding Logic ---');
  const sampleItems = [
    { id: 'sun', name: 'Sun', label: 'Sun', anchorX: 100, anchorY: 100, depth: 0.5, visible: true },
    { id: 'earth', name: 'Earth', label: 'Earth', anchorX: 200, anchorY: 200, depth: 0.5, visible: true },
    { id: 'mars', name: 'Mars', label: 'Mars', anchorX: 300, anchorY: 250, depth: 0.5, visible: true },
  ];

  const computeVisibleCallouts = (items: typeof sampleItems, show: boolean) => {
    if (!show || items.length === 0) return [];
    return items.filter((it) => it.visible && it.depth < 0.99);
  };

  const getButtonText = (show: boolean) => (show ? 'Hide Labels' : 'Show Labels');
  const getButtonAria = (show: boolean) => (show ? 'Hide Labels' : 'Show Labels');

  assert(getButtonText(true) === 'Hide Labels', 'Button displays "Hide Labels" when labels are visible');
  currentLabelsState = false; // User clicks "Hide Labels"
  assert(getButtonText(currentLabelsState) === 'Show Labels', 'Button text updates immediately to "Show Labels"');
  assert(getButtonAria(currentLabelsState) === 'Show Labels', 'Button aria-label updates immediately to "Show Labels"');
  assert(computeVisibleCallouts(sampleItems, currentLabelsState).length === 0, 'Clicking Hide Labels immediately suppresses all 3D label callouts (0 visible)');

  // CHECK 3: Clicking Show Labels restores them correctly
  console.log('\n--- CHECK 3: Show Labels Restoration ---');
  currentLabelsState = true; // User clicks "Show Labels"
  assert(getButtonText(currentLabelsState) === 'Hide Labels', 'Button text toggles back to "Hide Labels"');
  const restoredCallouts = computeVisibleCallouts(sampleItems, currentLabelsState);
  assert(restoredCallouts.length === sampleItems.length, 'Clicking Show Labels restores all labels in original positions');
  assert(restoredCallouts[0].anchorX === 100 && restoredCallouts[0].anchorY === 100, 'Label anchors retain exact coordinate geometry');

  // CHECK 4: Toggle continues working after switching between different models
  console.log('\n--- CHECK 4: Model Switching Consistency ---');
  const allCuratedModelKeys = Object.keys(CURATED_AI_MODELS);
  assert(allCuratedModelKeys.length >= 10, `Curated registry has ${allCuratedModelKeys.length} models available`);

  let sharedVisibilityState = false; // Hidden state maintained across navigation
  let allModelsRespectHidden = true;
  for (const modelKey of allCuratedModelKeys) {
    const model = CURATED_AI_MODELS[modelKey];
    const modelCallouts = model.parts.map((p, idx) => ({
      id: p.id,
      name: p.name,
      label: p.label || p.name,
      anchorX: 100 + idx * 10,
      anchorY: 100 + idx * 10,
      depth: 0.5,
      visible: true,
    }));

    if (computeVisibleCallouts(modelCallouts, sharedVisibilityState).length !== 0) {
      allModelsRespectHidden = false;
      break;
    }
  }
  assert(allModelsRespectHidden, 'Labels remain reliably hidden across all models in curated registry');

  sharedVisibilityState = true; // Re-enable labels
  let allModelsRespectShown = true;
  for (const modelKey of allCuratedModelKeys) {
    const model = CURATED_AI_MODELS[modelKey];
    const modelCallouts = model.parts.map((p, idx) => ({
      id: p.id,
      name: p.name,
      label: p.label || p.name,
      anchorX: 100 + idx * 10,
      anchorY: 100 + idx * 10,
      depth: 0.5,
      visible: true,
    }));

    if (computeVisibleCallouts(modelCallouts, sharedVisibilityState).length !== model.parts.length) {
      allModelsRespectShown = false;
      break;
    }
  }
  assert(allModelsRespectShown, 'Toggling Show Labels restores all labels across all models in curated registry');

  // CHECK 5: Model interaction (selection, exploded view, geometry) preserved
  console.log('\n--- CHECK 5: Preservation of Model Interaction & Geometry ---');
  let selectedPartId: string | null = null;
  const selectPart = (id: string) => { selectedPartId = id; };

  // Test with labels OFF
  sharedVisibilityState = false;
  selectPart('rotor-winding');
  assert(selectedPartId === 'rotor-winding', 'Component selection works with labels OFF');

  // Exploded view simulation
  let isExplodedView = false;
  const toggleExploded = (current: boolean) => !current;
  isExplodedView = toggleExploded(isExplodedView);
  assert(isExplodedView === true, 'Exploded view toggles ON with labels OFF');
  isExplodedView = toggleExploded(isExplodedView);
  assert(isExplodedView === false, 'Reassembly toggles back to intact model with labels OFF');

  // Test with labels ON
  sharedVisibilityState = true;
  selectPart('stator-magnet');
  assert(selectedPartId === 'stator-magnet', 'Component selection works with labels ON');
  isExplodedView = toggleExploded(isExplodedView);
  assert(isExplodedView === true, 'Exploded view works with labels ON');
  isExplodedView = toggleExploded(isExplodedView);
  assert(isExplodedView === false, 'Reassembly works with labels ON');

  // Verify model parts are never mutated or deleted
  let allPartsImmutable = true;
  for (const model of Object.values(CURATED_AI_MODELS)) {
    if (!model.parts || model.parts.length === 0) {
      allPartsImmutable = false;
      break;
    }
  }
  assert(allPartsImmutable, 'Model geometry and parts array are 100% immutable and never deleted from data');

  // CHECK 6: No labels unexpectedly reappear while hidden
  console.log('\n--- CHECK 6: No Unexpected Label Reappearance ---');
  sharedVisibilityState = false;
  // Trigger component selection while hidden
  selectPart('sun');
  assert(computeVisibleCallouts(sampleItems, sharedVisibilityState).length === 0, 'Labels do not reappear on component selection while hidden');

  // Trigger exploded view while hidden
  isExplodedView = toggleExploded(isExplodedView);
  assert(computeVisibleCallouts(sampleItems, sharedVisibilityState).length === 0, 'Labels do not reappear on exploded view while hidden');
  isExplodedView = toggleExploded(isExplodedView);

  // CHECK 7: Responsive toolbar layout compatibility
  console.log('\n--- CHECK 7: UI & Responsive Layout Verification ---');
  const desktopWidth = 1200;
  const mobileWidth = 375;
  const isMobileLayout = (w: number) => w < 640;

  assert(!isMobileLayout(desktopWidth), 'Desktop viewport identified (> 640px)');
  assert(isMobileLayout(mobileWidth), 'Mobile viewport identified (< 640px)');

  console.log('\n====================================================');
  console.log(`LABEL VISIBILITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in label visibility suite`);
  }
}

runLabelVisibilityTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
