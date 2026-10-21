import { GoogleGenAI } from '@google/genai';
import { ResearchRecord, ResearchSource } from '../types/aiModel';

// In-memory research cache keyed by normalized topic so repeated identical queries remain fast
const researchCache = new Map<string, { record: ResearchRecord; expiresAt: number }>();
const RESEARCH_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Strips conversational wrapper text from a user prompt to isolate the core scientific topic.
 */
export function buildCleanResearchQuery(rawPrompt: string): string {
  const cleaned = String(rawPrompt || '')
    .replace(
      /^(please\s+)?(create|generate|build|make|show|design|render|construct|simulate)\s+(me\s+)?(a\s+|an\s+|the\s+)?(custom\s+|new\s+|fresh\s+)?(interactive\s+|scientific\s+|functional\s+|detailed\s+)?(3d\s+)?(model|simulation|explorer|diagram|assembly|cutaway|representation)\s+(of\s+|for\s+|showing\s+|about\s+)?/i,
      ''
    )
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || rawPrompt.trim();
}

/**
 * Sanitizes untrusted web text, stripping HTML tags, control characters, and any prompt-like instructions.
 */
function sanitizeUntrustedWebText(text: string): string {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '')
    .replace(/system\s+prompt/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts crisp scientific sentences and component terminology from retrieved source text.
 */
function extractScientificFactsAndComponents(
  topic: string,
  combinedText: string
): { facts: string[]; components: string[]; mechanism: string; equations: string[] } {
  const sentences = combinedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 280 && !s.includes('=='));

  // Prioritize sentences mentioning structure, parts, mechanism, pressure, flow, force, or energy
  const scoredSentences = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    let score = 0;
    if (
      /consists of|composed of|comprises|contains|includes|structure|component|chamber|cylinder|piston|rotor|stator|tubule|glomerulus|turbine|compressor|nozzle|magma|conduit|crater|joint|actuator|gripper|valve|membrane|coil|shaft/i.test(
        lower
      )
    ) {
      score += 3;
    }
    if (
      /operates|functions|works by|pressure|force|flow|torque|voltage|current|filtration|thrust|eruption|kinematics|equation|law|principle|conservation/i.test(
        lower
      )
    ) {
      score += 2;
    }
    return { sentence, score };
  });

  scoredSentences.sort((a, b) => b.score - a.score);
  const topFacts = scoredSentences.slice(0, 5).map((item) => item.sentence);

  // Extract candidate component terms from the retrieved text
  const componentPatterns = [
    /\b([a-z]+(?:\s+[a-z]+){0,2}\s+(?:cylinder|piston|plunger|ram|valve|manifold|reservoir|chamber|conduit|vent|crater|cone|layer|crust|arteriole|glomerulus|capsule|tubule|loop of henle|collecting duct|capillary|fan|compressor|combustor|turbine|nozzle|shaft|casing|base|joint|shoulder|elbow|wrist|gripper|link|arm|actuator|rotor|stator|blade|nacelle|hub|tower|gearbox|pedal|caliper|disc|pad|electrode|membrane|electrolyte|coil|core))\b/gi,
  ];

  const foundComponents = new Set<string>();
  for (const regex of componentPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(combinedText)) !== null) {
      const candidate = match[1]
        .trim()
        .replace(/^(the|a|an|its|with|in|of|and|or|to|from|by|as|at|on|for)\s+/i, '')
        .trim();
      if (candidate.length >= 4 && candidate.length <= 42) {
        const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        foundComponents.add(formatted);
      }
      if (foundComponents.size >= 10) break;
    }
  }

  const mechanism =
    topFacts.find((f) =>
      /works|operates|pressure|flow|thrust|filtration|force|torque|convert|erupt|rotat/i.test(f)
    ) ||
    topFacts[0] ||
    `Operates via coupled physical and structural interactions specific to ${topic}.`;

  const equations: string[] = [];
  const lowerTopic = `${topic} ${combinedText}`.toLowerCase();
  if (lowerTopic.includes('hydraulic') || lowerTopic.includes('pascal')) {
    equations.push('P = F₁ / A₁ = F₂ / A₂', 'F₂ = F₁ × (A₂ / A₁)', 'W = F₁ · d₁ = F₂ · d₂');
  }
  if (lowerTopic.includes('nephron') || lowerTopic.includes('glomerul') || lowerTopic.includes('renal')) {
    equations.push('NFP = P_GC − P_BC − π_GC', 'GFR = K_f × NFP');
  }
  if (lowerTopic.includes('jet engine') || lowerTopic.includes('turbofan') || lowerTopic.includes('brayton')) {
    equations.push('F_thrust = ṁ · (v_exit − v_0) + (P_e − P_0) · A_e', 'η_Brayton = 1 − (1 / r_p^((γ−1)/γ))');
  }
  if (lowerTopic.includes('volcano') || lowerTopic.includes('magma')) {
    equations.push('P_magma = ρ · g · h + ΔP_volatiles', 'H_plume ∝ Q_thermal^(1/4)');
  }
  if (lowerTopic.includes('robotic arm') || lowerTopic.includes('manipulator') || lowerTopic.includes('kinematic')) {
    equations.push('x = L₁·cos(θ₁) + L₂·cos(θ₁ + θ₂)', 'τ = Jᵀ(θ) · F_ext');
  }
  if (lowerTopic.includes('wind turbine') || lowerTopic.includes('betz')) {
    equations.push('P_wind = ½ · ρ · A · v³ · C_p (C_p,max = 16/27 ≈ 59.3%)', 'λ = (ω · R) / v_wind');
  }

  return {
    facts: topFacts,
    components: Array.from(foundComponents),
    mechanism,
    equations,
  };
}

/**
 * Fetches live scientific reference articles and technical extracts from Wikipedia's MediaWiki API.
 */
async function fetchWikipediaScientificSources(searchQuery: string): Promise<{
  sources: ResearchSource[];
  combinedExtract: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    // Expand query slightly if very short to disambiguate scientific sense
    const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', searchQuery);
    searchUrl.searchParams.set('utf8', '1');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('srlimit', '5');

    const searchRes = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'TechAnatomixScienceLab/2.0 (Educational 3D Model Research Engine)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!searchRes.ok) {
      return { sources: [], combinedExtract: '' };
    }

    const searchData: any = await searchRes.json();
    const searchHits: any[] = searchData?.query?.search || [];
    if (searchHits.length === 0) {
      return { sources: [], combinedExtract: '' };
    }

    // Filter out pop-culture / channel / disambiguation articles when scientific matches exist
    const filteredHits = searchHits.filter(
      (h) =>
        !/channel|film|album|band|song|novel|disambiguation|episode/i.test(String(h.title || ''))
    );
    const chosenHits = (filteredHits.length > 0 ? filteredHits : searchHits).slice(0, 3);
    const topTitles = chosenHits.map((h) => h.title);

    const extractUrl = new URL('https://en.wikipedia.org/w/api.php');
    extractUrl.searchParams.set('action', 'query');
    extractUrl.searchParams.set('prop', 'extracts|info');
    extractUrl.searchParams.set('exintro', '1');
    extractUrl.searchParams.set('explaintext', '1');
    extractUrl.searchParams.set('redirects', '1');
    extractUrl.searchParams.set('inprop', 'url');
    extractUrl.searchParams.set('titles', topTitles.join('|'));
    extractUrl.searchParams.set('format', 'json');

    const extractRes = await fetch(extractUrl.toString(), {
      headers: {
        'User-Agent': 'TechAnatomixScienceLab/2.0 (Educational 3D Model Research Engine)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!extractRes.ok) {
      return { sources: [], combinedExtract: '' };
    }

    const extractData: any = await extractRes.json();
    const pagesObj = extractData?.query?.pages || {};
    const sources: ResearchSource[] = [];
    const extracts: string[] = [];

    for (const page of Object.values(pagesObj) as any[]) {
      if (!page || page.missing !== undefined) continue;
      const cleanExtract = sanitizeUntrustedWebText(page.extract || '');
      const fullUrl =
        typeof page.fullurl === 'string' && page.fullurl.startsWith('http')
          ? page.fullurl
          : `https://en.wikipedia.org/wiki/${encodeURIComponent(String(page.title || '').replace(/\s+/g, '_'))}`;

      if (cleanExtract.length > 40) {
        extracts.push(cleanExtract);
        sources.push({
          title: `${page.title} — Wikipedia Scientific Reference`,
          url: fullUrl,
          snippet: cleanExtract.slice(0, 320) + (cleanExtract.length > 320 ? '...' : ''),
          domain: 'en.wikipedia.org',
        });
      }
    }

    return {
      sources,
      combinedExtract: extracts.join(' '),
    };
  } catch {
    return { sources: [], combinedExtract: '' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Optional Gemini Google Search grounding lookup when a live Gemini client is configured.
 */
async function fetchGeminiGroundedResearch(
  aiClient: GoogleGenAI,
  topic: string
): Promise<{
  sources: ResearchSource[];
  facts: string[];
  components: string[];
}> {
  try {
    const response = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Research the scientific and engineering structure of "${topic}" for a 3D interactive model. List its essential physical components, how they are connected, its working mechanism, and governing equations.`,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini search grounding timeout')), 5500)
      ),
    ]);

    const groundingChunks: any[] =
      (response as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: ResearchSource[] = [];
    for (const chunk of groundingChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (typeof uri === 'string' && uri.startsWith('http')) {
        let domain = 'web';
        try {
          domain = new URL(uri).hostname;
        } catch {}
        sources.push({
          title: sanitizeUntrustedWebText(title || domain),
          url: uri,
          snippet: `Retrieved via Google Search grounding for ${topic}.`,
          domain,
        });
      }
    }

    const text = sanitizeUntrustedWebText((response as any)?.text || '');
    const parsed = extractScientificFactsAndComponents(topic, text);
    return {
      sources: sources.slice(0, 4),
      facts: parsed.facts,
      components: parsed.components,
    };
  } catch {
    return { sources: [], facts: [], components: [] };
  }
}

/**
 * Main entry point for Phase 2 Real Web Research.
 * Executes live web retrieval before model specification & 3D synthesis,
 * storing verifiable source URLs, titles, and extracted facts.
 */
export async function performScientificWebResearch(
  rawPrompt: string,
  aiClient?: GoogleGenAI | null
): Promise<ResearchRecord> {
  const cleanTopic = buildCleanResearchQuery(rawPrompt);
  const cacheKey = cleanTopic.toLowerCase();

  const cached = researchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.record,
      query: rawPrompt,
    };
  }

  // 1. Query Wikipedia Scientific Reference API
  const wikiResult = await fetchWikipediaScientificSources(cleanTopic);

  // 2. If Gemini client is available and Wikipedia returned no sources, or to enrich grounding
  let geminiSources: ResearchSource[] = [];
  let geminiFacts: string[] = [];
  let geminiComponents: string[] = [];
  if (aiClient && wikiResult.sources.length === 0) {
    const grounded = await fetchGeminiGroundedResearch(aiClient, cleanTopic);
    geminiSources = grounded.sources;
    geminiFacts = grounded.facts;
    geminiComponents = grounded.components;
  }

  const allSources = [...wikiResult.sources, ...geminiSources];
  const parsedWiki = extractScientificFactsAndComponents(cleanTopic, wikiResult.combinedExtract);

  const combinedFacts = Array.from(new Set([...parsedWiki.facts, ...geminiFacts])).slice(0, 6);
  const combinedComponents = Array.from(
    new Set([...parsedWiki.components, ...geminiComponents])
  ).slice(0, 10);

  const hasWebEvidence = allSources.length > 0 && combinedFacts.length > 0;

  const record: ResearchRecord = {
    query: rawPrompt,
    normalizedTopic: cleanTopic,
    status: hasWebEvidence ? 'web-researched' : 'knowledge-based',
    timestamp: new Date().toISOString(),
    sources: hasWebEvidence ? allSources : [],
    retrievedFacts:
      combinedFacts.length > 0
        ? combinedFacts
        : [
            `Constructed from domain-verified scientific principles for ${cleanTopic}.`,
            `Models the essential structural components, topological connections, and quantitative relationships of ${cleanTopic}.`,
          ],
    extractedComponents: combinedComponents,
    extractedMechanism: parsedWiki.mechanism,
    extractedEquations: parsedWiki.equations.length > 0 ? parsedWiki.equations : undefined,
  };

  researchCache.set(cacheKey, {
    record,
    expiresAt: Date.now() + RESEARCH_CACHE_TTL_MS,
  });

  return record;
}
