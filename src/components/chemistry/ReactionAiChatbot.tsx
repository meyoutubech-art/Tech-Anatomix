import React, { useState, useRef, useEffect } from 'react';
import {
  evaluateReactionRecipe,
  ReactionEvaluationResult,
  REAGENTS,
  REACTIONS,
  getReagentDisplayInfo,
} from '../../data/reactionsData';
import { findOrLookupCompound } from '../../data/compoundRegistry';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Info,
  Layers,
  Thermometer,
  FlaskConical,
} from 'lucide-react';
import { FormattedAiMessage } from '../common/FormattedAiMessage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

interface ReactionAiChatbotProps {
  selectedIngredients: Array<{ id: string; amount: number; name: string; formula: string }>;
  conditions: {
    temperature: number;
    concentration: number;
    catalystId?: string | null;
  };
  activeReactionResult: ReactionEvaluationResult | null;
}

export const ReactionAiChatbot: React.FC<ReactionAiChatbotProps> = ({
  selectedIngredients,
  conditions,
  activeReactionResult,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '👋 Welcome! I am your **Chemistry Science Advisor**.\n\n' +
        'I provide real-time educational Q&A on chemical reactions, reaction mechanisms, stoichiometry, catalysts, and safety protocols.\n\n' +
        '💡 *Try asking me:*\n' +
        '• *"Why does effervescence occur when acid touches carbonate?"*\n' +
        '• *"What does a catalyst do in peroxide decomposition?"*\n' +
        '• *"Explain what will happen with the current beaker contents"*\n' +
        '• *"How does precipitate formation work?"*\n' +
        '• *"Is acid-base neutralization exothermic?"*\n\n' +
        '*(Note: As an educational Q&A assistant, I do not directly mutate or alter the beaker. Use the Experiment Builder and Discover a Reaction tools above to add compounds and run reactions!)*',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length]);

  /**
   * Helper to identify specific chemical reagents mentioned in a user's text query
   */
  const extractMentionedReagents = (queryText: string): string[] => {
    const q = queryText.toLowerCase();
    const foundIds = new Set<string>();

    const patterns: Array<{ id: string; keywords: string[] }> = [
      { id: 'pb_no3_2', keywords: ['lead nitrate', 'lead(ii) nitrate', 'pb(no3)2'] },
      { id: 'ki', keywords: ['potassium iodide', ' ki '] },
      { id: 'hcl', keywords: ['hydrochloric acid', 'hcl'] },
      { id: 'naoh', keywords: ['sodium hydroxide', 'naoh', 'caustic soda'] },
      { id: 'h2so4', keywords: ['sulfuric acid', 'h2so4'] },
      { id: 'hno3', keywords: ['nitric acid', 'hno3'] },
      { id: 'ch3cooh', keywords: ['acetic acid', 'vinegar', 'ch3cooh'] },
      { id: 'nahco3', keywords: ['baking soda', 'sodium bicarbonate', 'nahco3'] },
      { id: 'caco3', keywords: ['calcium carbonate', 'chalk', 'limestone', 'caco3'] },
      { id: 'agno3', keywords: ['silver nitrate', 'agno3'] },
      { id: 'nacl', keywords: ['sodium chloride', 'table salt', 'nacl'] },
      { id: 'bacl2', keywords: ['barium chloride', 'bacl2'] },
      { id: 'cuso4', keywords: ['copper sulfate', 'copper(ii) sulfate', 'cuso4'] },
      { id: 'cu', keywords: ['copper metal', ' copper ', ' elemental copper '] },
      { id: 'fe', keywords: ['iron powder', 'iron filings', ' fe '] },
      { id: 'zn', keywords: ['zinc metal', 'zinc granules', ' zn '] },
      { id: 'mg', keywords: ['magnesium ribbon', ' mg '] },
      { id: 'h2o2', keywords: ['hydrogen peroxide', 'peroxide', 'h2o2'] },
      { id: 'mno2', keywords: ['manganese dioxide', 'mno2'] },
      { id: 'k_metal', keywords: ['potassium metal', ' elemental potassium '] },
      { id: 'phenolphthalein', keywords: ['phenolphthalein'] },
      { id: 'universal_indicator', keywords: ['universal indicator'] },
      { id: 'water', keywords: ['distilled water', 'water', 'h2o'] },
    ];

    patterns.forEach((p) => {
      p.keywords.forEach((kw) => {
        const paddedQuery = ` ${q} `;
        if (paddedQuery.includes(kw)) {
          foundIds.add(p.id);
        }
      });
    });

    return Array.from(foundIds);
  };

  /**
   * Generates informative educational responses without mutating the experiment state.
   */
  const handleAnswerQuestion = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Direct mutation command attempt (add, remove, clear, run, heat, etc.)
    const isMutationIntent =
      q.startsWith('add ') ||
      q.startsWith('pour ') ||
      q.startsWith('put ') ||
      q.startsWith('mix ') ||
      q.startsWith('remove ') ||
      q.startsWith('delete ') ||
      q.includes('clear experiment') ||
      q.includes('empty beaker') ||
      q === 'run' ||
      q === 'run reaction' ||
      q === 'start reaction' ||
      q === 'execute' ||
      (q.includes('change temperature') && q.match(/\d+/)) ||
      (q.includes('set concentration') && q.match(/\d+/));

    if (isMutationIntent) {
      return (
        'ℹ️ **Educational Assistant Notice**: I am a read-only scientific educational advisor and do not directly mutate or alter your experiment bench.\n\n' +
        '• **To add compounds**: Click any compound card on the categorized **Reagent Shelf** or look up new chemicals using **AI-Assisted Compound Addition** above.\n' +
        '• **To discover full recipes**: Use the **"Discover a Reaction"** panel above and click **"Load Reaction into Experiment"**.\n' +
        '• **To run the reaction**: Click the prominent **"Run Reaction in 3D Beaker"** button in the Experiment Builder!'
      );
    }

    const mentionedIds = extractMentionedReagents(q);

    // 2. Questions explicitly asking about the CURRENT BEAKER experiment
    // or asking what happens / why it didn't react when reagents are already selected and no other chemicals are named
    const isExplicitBeakerQuery =
      q.includes('current') ||
      q.includes('my beaker') ||
      q.includes('beaker contents') ||
      q.includes('this experiment') ||
      q.includes('selected reagents') ||
      q.includes('selected chemicals') ||
      q.includes('in the beaker') ||
      q.includes('this mixture');

    const isImplicitBeakerQuery =
      selectedIngredients.length > 0 &&
      mentionedIds.length === 0 &&
      (q.includes('what happens') ||
        q.includes('what will happen') ||
        q.includes('will these react') ||
        q.includes('will they react') ||
        q.includes('do these react') ||
        q.includes('what are the products') ||
        q.includes('balanced equation') ||
        q.includes('why didn') ||
        q.includes('why do they not') ||
        q.includes('what can i react') ||
        q.includes('what should i add') ||
        q.includes('suggest a reaction'));

    if (isExplicitBeakerQuery || isImplicitBeakerQuery) {
      if (selectedIngredients.length === 0) {
        return (
          '🧪 **Current Beaker Snapshot**: The reaction beaker is currently **empty**.\n\n' +
          'To prepare an experiment, select reagents from the categorized shelf (Acids, Bases, Salts, Metals, Oxidizers, Indicators, Catalysts) or explore the **"Discover a Reaction"** tool above.'
        );
      }

      const evalRes = evaluateReactionRecipe({
        ingredients: selectedIngredients,
        conditions,
      });

      const ingredientsSummary = selectedIngredients
        .map((i) => `${i.name} (${i.formula}, ${i.amount} mL/g)`)
        .join(' + ');

      if (evalRes.isSupported && evalRes.reaction && evalRes.status === 'ready') {
        const r = evalRes.reaction;
        return (
          `🔬 **Scientific Evaluation for Current Beaker (${ingredientsSummary} at ${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M)**:\n\n` +
          `• **Status**: \`${evalRes.structuredStatus}\`\n` +
          `• **Reaction Name**: **${r.name}**\n` +
          `• **Balanced Chemical Equation**:\n  \`${r.balancedEquation}\`\n` +
          `• **Products**: ${r.products.join(', ')}\n` +
          `• **Classification**: ${r.reactionType.replace('_', ' ').toUpperCase()}\n` +
          `• **Observable Effects**: ${r.observableEffects.description}\n` +
          `• **Enthalpy Delta (ΔT)**: ${r.observableEffects.temperatureDelta > 0 ? `+${r.observableEffects.temperatureDelta}°C (Exothermic)` : r.observableEffects.temperatureDelta < 0 ? `${r.observableEffects.temperatureDelta}°C (Endothermic)` : '0°C (Thermal equilibrium)'}\n` +
          `• **Gas Evolution**: ${r.observableEffects.producesGas ? `Yes, active evolution of ${r.observableEffects.gasName}` : 'No gas evolved'}\n` +
          `• **Precipitate**: ${r.observableEffects.producesPrecipitate ? `Yes, solid forms (${r.observableEffects.precipitateColor || 'insoluble solid'})` : 'No precipitate (homogeneous)'}\n\n` +
          `• **Mechanism**: ${r.explanation}\n\n` +
          `*To observe these effects in the 3D beaker, click "Run Reaction in 3D Beaker" in the builder.*`
        );
      }

      if (evalRes.status === 'incomplete') {
        const singleId = selectedIngredients[0]?.id;
        const compatibleReactions = singleId
          ? REACTIONS.filter((rx) => rx.reactants.includes(singleId)).slice(0, 4)
          : [];
        const suggestionLines =
          compatibleReactions.length > 0
            ? `\n\n**Verified Complementary Reactions for ${selectedIngredients[0].name}**:\n` +
              compatibleReactions
                .map((rx) => {
                  const partners = rx.reactants
                    .filter((id) => id !== singleId)
                    .map((id) => getReagentDisplayInfo(id).name)
                    .join(' + ');
                  return `• Add **${partners}** → **${rx.name}** (\`${rx.balancedEquation}\`)`;
                })
                .join('\n')
            : '';

        return (
          `ℹ️ **Current Beaker Status**: \`${evalRes.structuredStatus}\`\n\n` +
          `• **Notice**: ${evalRes.message}\n` +
          `• **Currently Selected**: ${ingredientsSummary}.${suggestionLines}`
        );
      }

      return (
        `ℹ️ **Current Beaker Assessment (${ingredientsSummary})**: \`${evalRes.structuredStatus}\`\n\n` +
        `• **Result**: ${evalRes.message}\n\n` +
        `The substances currently in the beaker do not undergo spontaneous electron or proton exchange under standard classroom conditions (${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M).`
      );
    }

    // 3. Questions asking about SPECIFIC CHEMICALS mentioned in text
    if (mentionedIds.length >= 2) {
      const syntheticIngredients = mentionedIds.map((id) => ({ id, amount: 20 }));
      const evalRes = evaluateReactionRecipe({
        ingredients: syntheticIngredients,
        conditions: { temperature: 25, concentration: 1.0 },
      });

      if (evalRes.isSupported && evalRes.reaction) {
        const r = evalRes.reaction;
        const reactantNames = mentionedIds
          .map((id) => getReagentDisplayInfo(id).name)
          .join(' + ');

        return (
          `🔬 **Educational Reaction Explanation (${reactantNames})**:\n\n` +
          `• **Status**: \`${evalRes.structuredStatus}\`\n` +
          `• **Reaction Name**: **${r.name}**\n` +
          `• **Balanced Chemical Equation**:\n  \`${r.balancedEquation}\`\n` +
          `• **Classification**: ${r.reactionType.replace('_', ' ').toUpperCase()}\n` +
          `• **Observable Effects**: ${r.observableEffects.description}\n` +
          `• **Enthalpy Delta (ΔT)**: ${r.observableEffects.temperatureDelta > 0 ? `+${r.observableEffects.temperatureDelta}°C (Exothermic)` : r.observableEffects.temperatureDelta < 0 ? `${r.observableEffects.temperatureDelta}°C (Endothermic)` : '0°C (Thermal equilibrium)'}\n` +
          `• **Mechanism**: ${r.explanation}\n\n` +
          `*(Note: This is a verified educational explanation for ${reactantNames}. To load these compounds into your active beaker, use the "Discover a Reaction" panel above!)*`
        );
      }

      if (evalRes.structuredStatus === 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS') {
        const reactantNames = mentionedIds
          .map((id) => getReagentDisplayInfo(id).name)
          .join(' and ');

        return (
          `🔬 **Chemical Evaluation (${reactantNames})**:\n\n` +
          `• **Status**: \`${evalRes.structuredStatus}\`\n` +
          `• **Assessment**: ${evalRes.message}\n` +
          `• **Scientific Basis**: No spontaneous electron transfer, proton exchange, or insoluble precipitation occurs between these compounds under standard classroom conditions.`
        );
      }
    }

    // 3B. Single chemical mentioned in query asking what reacts with it
    if (
      mentionedIds.length === 1 &&
      (q.includes('react') || q.includes('combine') || q.includes('what happens'))
    ) {
      const targetId = mentionedIds[0];
      const info = getReagentDisplayInfo(targetId);
      const compatible = REACTIONS.filter((rx) => rx.reactants.includes(targetId)).slice(0, 4);
      if (compatible.length > 0) {
        return (
          `🔬 **Verified Reactions Involving ${info.name} (${info.formula})**:\n\n` +
          compatible
            .map((rx) => {
              const partners = rx.reactants
                .filter((id) => id !== targetId)
                .map((id) => getReagentDisplayInfo(id).name)
                .join(' + ');
              return `• **With ${partners}** → **${rx.name}**\n  Equation: \`${rx.balancedEquation}\`\n  Observation: ${rx.observableEffects.description}`;
            })
            .join('\n\n')
        );
      }
    }

    // 4. General Theory Questions: Effervescence / Gas Evolution
    if (q.includes('effervesc') || q.includes('bubble') || q.includes('fizz') || q.includes('gas')) {
      return (
        '🫧 **General Educational Chemistry Theory: Effervescence & Gas Evolution**:\n\n' +
        'Effervescence is the rapid escape of gas bubbles from an aqueous solution. Common educational causes:\n\n' +
        '1. **Carbonate + Acid (CO₂)**: Protons protonate carbonate or bicarbonate ions, forming unstable carbonic acid (H₂CO₃) which decomposes into water and effervescing carbon dioxide:\n' +
        '   `CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)↑`\n\n' +
        '2. **Active Metal + Acid (H₂)**: Metals with standard reduction potential below hydrogen (e.g. Mg, Zn) reduce hydronium protons to flammable hydrogen gas while the metal oxidizes into soluble cations:\n' +
        '   `Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)↑`\n\n' +
        '3. **Catalytic Decomposition (O₂)**: Hydrogen peroxide disproportionates rapidly when catalyzed by MnO₂ or KI, producing oxygen gas and steam.'
      );
    }

    // 5. General Theory Questions: Precipitate / Precipitation
    if (q.includes('precipitat') || q.includes('insoluble') || q.includes('solid form') || q.includes('cloudy')) {
      return (
        '❄️ **General Educational Chemistry Theory: Precipitate Formation & Solubility Rules**:\n\n' +
        'A precipitate is an insoluble solid that forms when two aqueous ionic solutions are mixed. ' +
        'This occurs when the ion concentration product exceeds the solubility product constant (**K_sp**), causing ions to aggregate into an electrostatic crystal lattice that falls out of solution.\n\n' +
        '• **Silver Chloride (AgCl)**: Dense curdy white precipitate formed when Ag⁺ meets Cl⁻ (K_sp = 1.8 × 10⁻¹⁰).\n' +
        '• **Lead(II) Iodide (PbI₂)**: Brilliant golden yellow crystalline precipitate ("Golden Rain").\n' +
        '• **Barium Sulfate (BaSO₄)**: Heavy fine white precipitate used in medical contrast radiography.\n' +
        '• **Copper(II) Hydroxide (Cu(OH)₂)**: Vibrant pale blue gelatinous precipitate formed with alkali.'
      );
    }

    // 6. General Theory Questions: Catalysts
    if (q.includes('catalyst') || q.includes('cataly')) {
      return (
        '⚡ **General Educational Chemistry Theory: Role of Catalysts in Reactions**:\n\n' +
        'A catalyst is a chemical substance that accelerates the rate of a chemical reaction by providing an alternative reaction pathway with a lower **activation energy (E_a)**, without being consumed in the net stoichiometric process.\n\n' +
        '• **Heterogeneous Catalysts**: In a different phase than reactants. For example, solid **Manganese Dioxide (MnO₂)** powder provides surface active sites for aqueous H₂O₂ decomposition.\n' +
        '• **Homogeneous Catalysts**: In the same phase as reactants. For example, aqueous **Potassium Iodide (KI)** ions catalyze peroxide disproportionation via an intermediate hypoiodite ion pathway.\n' +
        '• **Biological Enzymes**: Such as **Catalase**, which decomposes millions of peroxide molecules per second in living tissue.'
      );
    }

    // 7. General Theory Questions: Neutralization
    if (q.includes('neutral') || q.includes('acid') || q.includes('base') || q.includes('ph')) {
      return (
        '⚖️ **General Educational Chemistry Theory: Acid-Base Neutralization & Halochromic Indicators**:\n\n' +
        'Neutralization is a proton transfer reaction where an acid (proton donor) reacts with a base (hydroxide donor or proton acceptor):\n\n' +
        '• **Net Ionic Equation**: `H⁺(aq) + OH⁻(aq) → H₂O(l) + ΔH (-57.3 kJ/mol)`\n' +
        '• **Exothermic Nature**: The standard enthalpy of neutralization for strong acid-strong base reactions is approximately **-57.3 kJ/mol**, causing a noticeable rise in solution temperature.\n' +
        '• **Indicators**: Indicators like **Phenolphthalein** undergo structural lactone-ring opening in alkaline media (pH > 8.2), forming an extended conjugated pi system that turns vibrant fuchsia magenta.'
      );
    }

    // 8. General Theory Questions: Safety
    if (
      q.includes('safety') ||
      q.includes('hazard') ||
      q.includes('ppe') ||
      q.includes('uranium') ||
      q.includes('cyanide') ||
      q.includes('mercury')
    ) {
      return (
        '🛡️ **General Educational Chemistry Theory: Laboratory Safety & Standards**:\n\n' +
        'In educational science laboratories, personal protective equipment (PPE) is mandatory:\n' +
        '• Wear ANSI Z87.1 splash goggles, nitrile gloves, and a buttoned lab coat.\n' +
        '• Never taste reagents or smell fumes directly; use the hand-wafting technique.\n' +
        '• Always add concentrated acid to water slowly, never water into acid.\n' +
        '• Reactions emitting toxic gases (such as NO₂ from copper oxidation) must be performed inside a certified fume hood.\n' +
        '• Radioactive, weaponized, or highly toxic substances (cyanides, mercury, uranium) are strictly excluded from educational simulations.'
      );
    }

    // 9. Fallback general educational response
    return (
      `🎓 **General Educational Chemistry Guide**:\n\n` +
      `You asked about: "${query}".\n\n` +
      `In this virtual laboratory, chemical reactions obey fundamental physical laws: conservation of mass, charge balance, Arrhenius collision theory, and thermodynamics (exothermic vs endothermic).\n\n` +
      `Feel free to ask about specific reaction mechanisms (such as *effervescence*, *precipitation*, *catalysis*, *neutralization*, or *metal displacement*) or ask for a scientific evaluation of specific compounds!`
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const q = userText.toLowerCase();
    const isMutationIntent =
      q.startsWith('add ') ||
      q.startsWith('pour ') ||
      q.startsWith('put ') ||
      q.startsWith('mix ') ||
      q.startsWith('remove ') ||
      q.startsWith('delete ') ||
      q.includes('clear experiment') ||
      q.includes('empty beaker') ||
      q === 'run' ||
      q === 'run reaction' ||
      q === 'start reaction' ||
      q === 'execute' ||
      (q.includes('change temperature') && q.match(/\d+/)) ||
      (q.includes('set concentration') && q.match(/\d+/));

    // For mutation guard or offline mode, use deterministic chemistry advisor immediately
    if (isMutationIntent || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const reply = handleAnswerQuestion(userText);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const localEvaluation = handleAnswerQuestion(userText);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          modelTitle: 'Chemical Reaction Laboratory',
          subject: 'Chemistry',
          context: {
            title: 'Chemical Reaction Laboratory',
            subject: 'Chemistry',
            concept: 'Stoichiometry, Aqueous Reactions, Kinetics & Thermodynamics',
            parameters: {
              temperature: `${conditions.temperature}°C`,
              concentration: `${conditions.concentration.toFixed(1)} M`,
              catalyst: conditions.catalystId || 'None',
              selectedReagents: selectedIngredients.map((i) => `${i.name} (${i.formula}, ${i.amount})`).join(', ') || 'Empty Beaker',
            },
            results: {
              reactionStatus: activeReactionResult?.structuredStatus || 'READY',
              localChemistryNotes: localEvaluation,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiText = data.answer && data.activeModel !== 'deterministic-offline' ? data.answer : localEvaluation;
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: aiText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: localEvaluation,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      const fallbackReply = handleAnswerQuestion(userText);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Explain current reagents',
    'Why does effervescence occur?',
    'What does a catalyst do?',
    'How does precipitation work?',
    'Is neutralization exothermic?',
    'Laboratory safety guidelines',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col text-slate-100">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Reaction AI Lab Assistant (Educational Q&A)
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Chemical Theory & Scientific Explanation · Read-Only Educational Advisor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeReactionResult?.structuredStatus && (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              {activeReactionResult.structuredStatus}
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
            Q&A Isolation Guard Active
          </span>
        </div>
      </div>

      {/* Live Experiment State Context Bar */}
      <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Beaker Context:</span>
          </span>
          {selectedIngredients.length === 0 ? (
            <span className="text-slate-500 italic">Empty Beaker (0 reagents selected)</span>
          ) : (
            selectedIngredients.map((ing, idx) => (
              <span
                key={`${ing.id}-${idx}`}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px] border border-slate-700"
              >
                {ing.formula} ({ing.amount})
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>T: {conditions.temperature}°C</span>
          <span>•</span>
          <span>C: {conditions.concentration.toFixed(1)} M</span>
          {conditions.catalystId && (
            <>
              <span>•</span>
              <span className="text-amber-300">Cat: {getReagentDisplayInfo(conditions.catalystId).formula}</span>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="p-4 sm:p-5 space-y-3.5 max-h-[300px] overflow-y-auto bg-slate-900/60 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
              <span>{m.role === 'user' ? 'You' : 'AI Science Advisor'}</span>
              <span>•</span>
              <span>{m.time}</span>
            </div>
            <div
              className={`p-3.5 rounded-2xl max-w-xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs shadow-xs'
              }`}
            >
              <FormattedAiMessage
                text={m.text}
                variant={m.role === 'user' ? 'user' : 'dark'}
              />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 italic py-1 px-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Synthesizing chemical mechanism & stoichiometry...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Questions */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="shrink-0 font-medium text-slate-500">Ask about:</span>
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setInput(p);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap transition-colors cursor-pointer border border-slate-700/50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask a chemistry question (e.g., "Why does calcium carbonate fizz with HCl?", "What does a catalyst do?")...'
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </div>
  );
};
