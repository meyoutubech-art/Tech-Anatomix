import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  isEligibleForKeyTakeaways,
  extractLocalScientificTakeaways,
  findPrecedingUserQuestion,
} from '../utils/keyTakeawaysService';
import { generateKeyTakeaways } from '../server/geminiService';

console.log('Running AI Q&A Key Takeaways ("✨ Important Points") Verification Suite...');

// 1. Verify eligibility filtering
assert.strictEqual(
  isEligibleForKeyTakeaways(
    { id: 'welcome-1', role: 'assistant', text: 'Hello! I am your dedicated AI Lab Mentor synchronized with Human Heart.' },
    0
  ),
  false,
  'Index 0 welcome message should NOT be eligible for Key Takeaways'
);

assert.strictEqual(
  isEligibleForKeyTakeaways(
    { id: 'user-1', role: 'user', text: 'How does the left ventricle pump oxygenated blood through the aorta into systemic circulation?' },
    1
  ),
  false,
  'User message should NOT be eligible for Key Takeaways'
);

assert.strictEqual(
  isEligibleForKeyTakeaways(
    { id: 'ai-param-1', role: 'assistant', text: '✅ Updated **Temperature** to **350 K** (operational range: 250–600 K). The 3D model simulation and physical equations have updated in real time.' },
    2
  ),
  false,
  'Parameter update confirmation message should NOT be eligible for Key Takeaways'
);

assert.strictEqual(
  isEligibleForKeyTakeaways(
    {
      id: 'ai-1',
      role: 'assistant',
      text: 'The **Left Ventricle** has the thickest myocardium because it must generate high hydrostatic pressure (120 mmHg) to overcome aortic afterload and pump oxygenated blood through the entire systemic circulation. Cardiac output is governed by `CO = HR × SV`.',
    },
    2
  ),
  true,
  'Substantive educational AI response MUST be eligible for Key Takeaways'
);

// 2. Verify preceding user question resolution
const sampleConvo = [
  { role: 'assistant', text: 'Welcome!' },
  { role: 'user', text: 'How does the Arrhenius equation relate activation energy to reaction rate?' },
  {
    role: 'assistant',
    text: 'The **Arrhenius Equation** (`k = A × e^(-Ea / RT)`) shows that the rate constant increases exponentially with temperature and decreases as the **Activation Energy (Ea)** barrier increases. Adding a **catalyst** provides an alternative pathway with a lower Ea.',
  },
];

assert.strictEqual(
  findPrecedingUserQuestion(sampleConvo, 2),
  'How does the Arrhenius equation relate activation energy to reaction rate?',
  'Should locate the preceding user question for an assistant message'
);

// 3. Verify deterministic scientific takeaways extraction across Physics, Chemistry, and Biology
const chemTakeaways = extractLocalScientificTakeaways(
  sampleConvo[2].text,
  sampleConvo[1].text,
  {
    title: 'Chemical Kinetics Simulator',
    subject: 'Chemistry',
    examConnection: 'Remember that a catalyst lowers Ea without changing ΔH or K_eq.',
  }
);

assert.ok(chemTakeaways.includes('•'), 'Extracted takeaways must contain bullet points');
assert.ok(chemTakeaways.includes('**'), 'Extracted takeaways must highlight key concepts in bold');
assert.ok(
  chemTakeaways.includes('k = A × e^(-Ea / RT)') || chemTakeaways.includes('Arrhenius'),
  'Extracted takeaways must preserve scientific formulas and key terms'
);
assert.ok(
  !chemTakeaways.includes('$'),
  'Extracted takeaways must never emit raw LaTeX dollar-sign syntax'
);

// 4. Verify component integration across all 4 AI Q&A interfaces
const qnaComponents = [
  'src/components/ai/ModelAwareChatbot.tsx',
  'src/components/ai/ExternalModelAiChat.tsx',
  'src/components/chemistry/ReactionAiChatbot.tsx',
  'src/components/ai/AiLabAssistant.tsx',
];

for (const relPath of qnaComponents) {
  const fullPath = path.resolve(relPath);
  assert.ok(fs.existsSync(fullPath), `${relPath} exists`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  assert.ok(
    content.includes('AiKeyTakeawaysPanel'),
    `${relPath} integrates AiKeyTakeawaysPanel`
  );
  assert.ok(
    content.includes('isEligibleForKeyTakeaways'),
    `${relPath} checks message eligibility with isEligibleForKeyTakeaways`
  );
}

// 5. Verify server-side generateKeyTakeaways function
async function runAsyncChecks() {
  const res = await generateKeyTakeaways(
    'What is the role of the split-ring commutator in a DC motor?',
    'The **Split-Ring Commutator** reverses the direction of electric current through the rotating **armature coil** every half-turn (180°). This ensures that the **Lorentz Force** (`F = I × L × B`) always produces unidirectional torque (`τ = N × B × I × A × sin(θ)`), keeping the motor spinning continuously in one direction.',
    'DC Electric Motor',
    'Physics',
    {
      title: 'DC Electric Motor',
      subject: 'Physics',
      selectedComponent: {
        id: 'commutator',
        name: 'Split-Ring Commutator',
        whatDoesItDo: 'Reverses armature current every half rotation to maintain continuous unidirectional torque.',
      },
    }
  );

  assert.ok(res && typeof res.takeaways === 'string' && res.takeaways.length > 30, 'generateKeyTakeaways returns non-empty takeaways');
  assert.ok(res.takeaways.includes('•'), 'generateKeyTakeaways output is formatted as bullet points');
  console.log('✅ AI Q&A Key Takeaways ("✨ Important Points") Verification Passed!');
}

runAsyncChecks().catch((err) => {
  console.error('❌ Key Takeaways test failed:', err);
  process.exit(1);
});
