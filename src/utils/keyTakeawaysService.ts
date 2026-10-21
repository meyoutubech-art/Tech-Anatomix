import { cleanAndFormatScientificText } from './scientificTextFormatter';

export interface KeyTakeawaysState {
  loading: boolean;
  isOpen: boolean;
  content: string | null;
  error: string | null;
  activeModel?: string;
}

export interface KeyTakeawaysRequestParams {
  question?: string;
  answer: string;
  modelTitle?: string;
  subject?: string;
  context?: Record<string, any>;
}

/**
 * Determines whether a chat message is eligible to display the "✨ Important Points" action.
 * Excludes user messages, initial welcome greetings, error banners, and short parameter-toggle confirmations.
 */
export function isEligibleForKeyTakeaways(
  message: { id?: string; role: 'user' | 'assistant' | string; text: string },
  index: number
): boolean {
  if (!message || message.role !== 'assistant') return false;

  // Exclude the initial welcome/greeting message at index 0 or with a welcome id
  if (index === 0) return false;
  if (message.id && message.id.toLowerCase().startsWith('welcome')) return false;
  if (message.id && message.id.toLowerCase().startsWith('ai-param-')) return false;
  if (message.id && message.id.toLowerCase().startsWith('ai-err-')) return false;

  const text = (message.text || '').trim();
  if (text.length < 45) return false;

  // Exclude initial greeting patterns
  if (
    text.startsWith('Hello! I am VIZLAB AI') ||
    text.startsWith('Hello! I am your dedicated') ||
    text.startsWith('Hello! I am your **AI Learning Assistant**') ||
    text.startsWith('👋 Welcome! I am your **Chemistry Science Advisor**')
  ) {
    return false;
  }

  // Exclude pure offline connection notices, parameter-change confirmations, or error messages
  const nonEducationalPrefixes = [
    '⚡ **Offline Mode Active**',
    '🔄 Reset all simulation parameters',
    '✅ Updated **',
    '✅ Increased **',
    '✅ Decreased **',
    '✅ Toggled **',
    '⚠️ **',
    'ℹ️ **Educational Assistant Notice**',
    '🧪 **Current Beaker Snapshot**: The reaction beaker is currently **empty**',
    'VIZLAB could not retrieve a response',
    '⚠️ AI Service',
    '⚠️ Network',
    '⚠️ Request',
  ];

  for (const prefix of nonEducationalPrefixes) {
    if (text.startsWith(prefix)) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts structured, concise "Important Points / Key Takeaways" directly from an AI response
 * and its active scientific model context. Used both as an instant offline/fallback engine
 * and server-side deterministic backup.
 */
export function extractLocalScientificTakeaways(
  answer: string,
  question?: string,
  context?: Record<string, any>
): string {
  const cleaned = cleanAndFormatScientificText(answer || '').trim();
  if (!cleaned) {
    return '• **Core Takeaway**: Review the active 3D model components and governing scientific relationships.';
  }

  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletCandidates: string[] = [];
  const formulaCandidates: string[] = [];

  for (const line of lines) {
    // Skip markdown headings by themselves
    if (/^#{1,4}\s+/.test(line)) {
      continue;
    }

    // Detect standalone backtick equations or lines with clear mathematical/chemical equations
    if (
      (line.startsWith('`') && line.endsWith('`') && line.length > 4) ||
      (/(?:=|→|⇌|⟶)/.test(line) && line.length < 110 && !line.startsWith('•') && !line.startsWith('-'))
    ) {
      const strippedEq = line.replace(/^`+|`+$/g, '').trim();
      if (strippedEq && !formulaCandidates.includes(strippedEq)) {
        formulaCandidates.push(strippedEq);
      }
      continue;
    }

    // Extract inline backtick equations inside lines
    const inlineCodeMatches = line.match(/`([^`]{4,80})`/g);
    if (inlineCodeMatches) {
      for (const match of inlineCodeMatches) {
        const inner = match.slice(1, -1).trim();
        if (/(?:=|→|⇌|⟶|\+|×|÷|²|³|₁|₂|₃|₄)/.test(inner) && !formulaCandidates.includes(inner)) {
          formulaCandidates.push(inner);
        }
      }
    }

    // Extract bullet or numbered items
    const listMatch = line.match(/^(?:[-•*]|\d+\.)\s+(.*)$/);
    if (listMatch && listMatch[1]) {
      const itemText = listMatch[1].trim();
      // Skip meta/UI instruction lines
      if (
        itemText.length >= 18 &&
        !itemText.toLowerCase().startsWith('to observe these effects') &&
        !itemText.toLowerCase().startsWith('orbit around the specimen') &&
        !itemText.toLowerCase().startsWith('zoom in with your scroll') &&
        !itemText.toLowerCase().startsWith('feel free to ask')
      ) {
        bulletCandidates.push(itemText);
      }
      continue;
    }

    // Split paragraph into individual sentences
    const sentences = line
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 22);

    for (const s of sentences) {
      const lowerS = s.toLowerCase();
      if (
        lowerS.startsWith('feel free to ask') ||
        lowerS.startsWith('you can interact directly') ||
        lowerS.startsWith('use the interactive 3d viewer') ||
        lowerS.startsWith('*(note:') ||
        lowerS.startsWith('*to observe')
      ) {
        continue;
      }
      bulletCandidates.push(s);
    }
  }

  // Deduplicate and score candidates (prioritize lines with **bold** scientific terms, causal keywords, or numbers/units)
  const uniquePoints: string[] = [];
  for (const candidate of bulletCandidates) {
    const normalized = candidate.replace(/^[-•*]\s*/, '').trim();
    if (!normalized) continue;
    const isDuplicate = uniquePoints.some(
      (existing) =>
        existing.toLowerCase() === normalized.toLowerCase() ||
        existing.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(existing.toLowerCase())
    );
    if (!isDuplicate) {
      uniquePoints.push(normalized);
    }
  }

  const scoredPoints = uniquePoints
    .map((pt, idx) => {
      let score = 0;
      if (/\*\*[^*]+\*\*/.test(pt)) score += 4;
      if (/\b(because|causes|results in|proportional|increases|decreases|converts|prevents|regulates|produces|transfers|law|principle|function|mechanism|equilibrium|rate|energy|force|pressure|voltage|current)\b/i.test(pt)) {
        score += 3;
      }
      if (idx === 0) score += 2; // Keep primary definition/thesis near top
      return { pt, score, idx };
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, 4)
    .sort((a, b) => a.idx - b.idx)
    .map((item) => {
      const text = item.pt;
      // Ensure every point has a bold lead-in or highlighted concept for rapid scanning
      if (/\*\*[^*]+\*\*/.test(text)) {
        return `• ${text}`;
      }
      const colonIdx = text.indexOf(':');
      if (colonIdx > 2 && colonIdx < 38) {
        return `• **${text.slice(0, colonIdx)}**:${text.slice(colonIdx + 1)}`;
      }
      return `• ${text}`;
    });

  // Fallback if answer was a single compact sentence
  if (scoredPoints.length === 0) {
    scoredPoints.push(`• **Core Concept**: ${cleaned.slice(0, 220)}`);
  }

  // Check context for equations if none found directly in text
  if (formulaCandidates.length === 0 && context) {
    if (Array.isArray(context.equations) && context.equations.length > 0) {
      formulaCandidates.push(cleanAndFormatScientificText(String(context.equations[0])));
    } else if (typeof context.formula === 'string' && context.formula.trim()) {
      formulaCandidates.push(cleanAndFormatScientificText(context.formula.trim()));
    }
  }

  const sections: string[] = [];
  sections.push(scoredPoints.join('\n'));

  if (formulaCandidates.length > 0) {
    sections.push(`• **Key Formula / Equation**: \`${formulaCandidates[0]}\``);
  }

  // Add a targeted Revision / Exam Focus point if context provides component or model metadata
  const targetName =
    context?.selectedComponent?.name ||
    context?.title ||
    (question ? question.replace(/[?!.]+$/, '').trim() : '');

  if (context?.examConnection) {
    sections.push(`• **Exam Tip**: ${cleanAndFormatScientificText(String(context.examConnection))}`);
  } else if (context?.selectedComponent?.whatDoesItDo) {
    sections.push(
      `• **Revision Focus (${context.selectedComponent.name})**: ${cleanAndFormatScientificText(
        String(context.selectedComponent.whatDoesItDo)
      )}`
    );
  } else if (targetName && scoredPoints.length < 4) {
    sections.push(
      `• **Revision Tip**: Connect each structure and parameter in **${targetName}** directly to its physical or physiological cause-and-effect outcome.`
    );
  }

  return cleanAndFormatScientificText(sections.join('\n'));
}

/**
 * Finds the preceding user question in a message array for a given assistant message index.
 */
export function findPrecedingUserQuestion(
  messages: Array<{ role: string; text: string }>,
  assistantIndex: number
): string {
  for (let i = assistantIndex - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user' && messages[i]?.text) {
      return messages[i].text;
    }
  }
  return '';
}

/**
 * Requests AI-generated Important Points / Key Takeaways for a specific AI answer,
 * with automatic fallback to the deterministic scientific extractor when offline or if the API fails.
 */
export async function requestKeyTakeaways(
  params: KeyTakeawaysRequestParams
): Promise<{ takeaways: string; activeModel: string }> {
  const { question = '', answer, modelTitle, subject, context } = params;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      takeaways: extractLocalScientificTakeaways(answer, question, context),
      activeModel: 'deterministic-offline',
    };
  }

  try {
    const response = await fetch('/api/ai/key-takeaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'key_takeaways',
        question,
        answer,
        modelTitle: modelTitle || context?.title || 'Scientific Simulation',
        subject: subject || context?.subject || 'Science',
        context,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawTakeaways = data.takeaways || data.answer || data.reply || data.text;
      if (rawTakeaways && typeof rawTakeaways === 'string' && rawTakeaways.trim()) {
        return {
          takeaways: cleanAndFormatScientificText(rawTakeaways.trim()),
          activeModel: data.activeModel || 'gemini',
        };
      }
    }

    // Secondary fallback via /api/ai/chat with action: 'key_takeaways'
    const chatResponse = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'key_takeaways',
        question,
        answer,
        modelTitle: modelTitle || context?.title || 'Scientific Simulation',
        subject: subject || context?.subject || 'Science',
        context,
      }),
    });

    if (chatResponse.ok) {
      const data = await chatResponse.json();
      const rawTakeaways = data.takeaways || data.answer || data.reply || data.text;
      if (rawTakeaways && typeof rawTakeaways === 'string' && rawTakeaways.trim()) {
        return {
          takeaways: cleanAndFormatScientificText(rawTakeaways.trim()),
          activeModel: data.activeModel || 'gemini',
        };
      }
    }
  } catch {
    // Fall through to deterministic scientific extractor
  }

  return {
    takeaways: extractLocalScientificTakeaways(answer, question, context),
    activeModel: 'deterministic-fallback',
  };
}
