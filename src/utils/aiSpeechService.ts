import { cleanAndFormatScientificText } from './scientificTextFormatter';

export type SpeechPlaybackStatus = 'idle' | 'playing' | 'paused' | 'unsupported' | 'error';

export interface SpeechStateListener {
  (state: {
    activeId: string | null;
    status: SpeechPlaybackStatus;
    errorMessage?: string | null;
  }): void;
}

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '₊': ' plus ',
  '₋': ' minus ',
  '₌': ' equals ',
  '₍': '(',
  '₎': ')',
  'ₐ': 'a',
  'ₑ': 'e',
  'ₒ': 'o',
  'ₓ': 'x',
  'ₕ': 'h',
  'ₖ': 'k',
  'ₗ': 'l',
  'ₘ': 'm',
  'ₙ': 'n',
  'ₚ': 'p',
  'ₛ': 's',
  'ₜ': 't',
};

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

const GREEK_AND_MATH_SYMBOLS: Array<[RegExp, string]> = [
  [/Δ/g, ' delta '],
  [/∇/g, ' del '],
  [/λ/g, ' lambda '],
  [/ω/g, ' omega '],
  [/Ω/g, ' ohms '],
  [/π/g, ' pi '],
  [/θ/g, ' theta '],
  [/μ/g, ' mu '],
  [/σ/g, ' sigma '],
  [/ε/g, ' epsilon '],
  [/τ/g, ' tau '],
  [/φ/g, ' phi '],
  [/Φ/g, ' phi '],
  [/ψ/g, ' psi '],
  [/Ψ/g, ' psi '],
  [/γ/g, ' gamma '],
  [/α/g, ' alpha '],
  [/β/g, ' beta '],
  [/ρ/g, ' rho '],
  [/η/g, ' eta '],
  [/⇌|<=>|↔/g, ' is in equilibrium with '],
  [/→|➔|⟶|->/g, ' leads to '],
  [/↑/g, ' increases '],
  [/↓/g, ' decreases '],
  [/≈/g, ' is approximately equal to '],
  [/≠/g, ' is not equal to '],
  [/≤/g, ' is less than or equal to '],
  [/≥/g, ' is greater than or equal to '],
  [/∝/g, ' is proportional to '],
  [/×/g, ' times '],
  [/÷/g, ' divided by '],
  [/±/g, ' plus or minus '],
  [/∞/g, ' infinity '],
  [/∑/g, ' sum of '],
  [/∫/g, ' integral of '],
  [/∂/g, ' partial '],
  [/°C\b/g, ' degrees Celsius'],
  [/°F\b/g, ' degrees Fahrenheit'],
  [/°/g, ' degrees '],
  [/Å/g, ' angstroms '],
];

/**
 * Converts scientific AI response text (containing Markdown, LaTeX, Unicode subscripts,
 * superscripts, chemical formulas, and mathematical equations) into clean, natural
 * spoken text suitable for Web Speech API synthesis without mutating the visual text.
 */
export function prepareScientificSpeechText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. Run standard scientific formatter to clean raw LaTeX tokens into readable Unicode first
  let text = cleanAndFormatScientificText(rawText);

  // 2. Strip Markdown code blocks, inline backticks, headings, bold/italic markers, and blockquotes
  text = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\s*>\s+/gm, '');

  // 3. Replace bullet points and numbered list markers with natural sentence pauses
  text = text
    .replace(/^\s*[•\-*]\s+/gm, '. ')
    .replace(/^\s*(\d+)\.\s+/gm, 'Point $1: ');

  // 4. Strip decorative emojis so the synthesizer doesn't read "sparkles" or "high voltage sign"
  text = text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu,
    ' '
  );

  // 5. Handle common ions and electronic notation before general superscript replacement
  text = text
    .replace(/e⁻/g, ' electron ')
    .replace(/H⁺/g, ' H plus ')
    .replace(/OH⁻/g, ' O H minus ')
    .replace(/([A-Za-z0-9])([²³⁴])⁺/g, (_, base, sup) => `${base} ${SUPERSCRIPT_DIGITS[sup] || sup} plus `)
    .replace(/([A-Za-z0-9])([²³⁴])⁻/g, (_, base, sup) => `${base} ${SUPERSCRIPT_DIGITS[sup] || sup} minus `)
    .replace(/⁺/g, ' plus ')
    .replace(/⁻/g, ' minus ');

  // 6. Handle common units with exponents (e.g., m/s², m², m³, cm³)
  text = text
    .replace(/\bm\/s²/g, ' meters per second squared ')
    .replace(/\bm\/s\b/g, ' meters per second ')
    .replace(/\bkm\/s\b/g, ' kilometers per second ')
    .replace(/\bcm³\b/g, ' cubic centimeters ')
    .replace(/\bm³\b/g, ' cubic meters ')
    .replace(/\bm²\b/g, ' square meters ');

  // 7. Handle square roots
  text = text
    .replace(/√\(([^)]+)\)/g, ' square root of $1 ')
    .replace(/√([A-Za-z0-9_]+)/g, ' square root of $1 ');

  // 8. Convert superscripts (e.g. x² -> x squared, x³ -> x cubed, 10⁻³ -> 10 to the power of minus 3)
  text = text.replace(/([A-Za-z0-9)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, base, supStr: string) => {
    if (supStr === '²') return `${base} squared`;
    if (supStr === '³') return `${base} cubed`;
    const decoded = supStr
      .split('')
      .map((ch) => (ch === '⁻' ? ' minus ' : SUPERSCRIPT_DIGITS[ch] || ch))
      .join('')
      .trim();
    return `${base} to the power of ${decoded}`;
  });

  // 9. Convert chemical formulas and subscripts (e.g. H₂O -> H 2 O, CO₂ -> C O 2, Kₛₚ -> K s p)
  text = text.replace(/([A-Za-z0-9)\]])([₀₁₂₃₄₅₆₇₈₉ₐₑₒₓₕₖₗₘₙₚₛₜ₊₋]+)/g, (_, base, subStr: string) => {
    const decoded = subStr
      .split('')
      .map((ch) => SUBSCRIPT_MAP[ch] || ch)
      .join(' ');
    return `${base} ${decoded}`;
  });
  // Also replace any standalone subscript characters
  text = text.replace(/[₀₁₂₃₄₅₆₇₈₉ₐₑₒₓₕₖₗₘₙₚₛₜ₊₋]/g, (ch) => ` ${SUBSCRIPT_MAP[ch] || ch} `);

  // 10. Expand common inline ASCII chemical formulas when written as H2O, CO2, O2, N2, CH4, NH3, NaCl
  text = text
    .replace(/\bH2O\b/g, 'H 2 O')
    .replace(/\bCO2\b/g, 'C O 2')
    .replace(/\bO2\b/g, 'O 2')
    .replace(/\bN2\b/g, 'N 2')
    .replace(/\bH2\b/g, 'H 2')
    .replace(/\bCH4\b/g, 'C H 4')
    .replace(/\bNH3\b/g, 'N H 3')
    .replace(/\bH2SO4\b/g, 'H 2 S O 4')
    .replace(/\bHCl\b/g, 'H C l')
    .replace(/\bNaOH\b/g, 'N a O H')
    .replace(/\bNaCl\b/g, 'N a C l');

  // 11. Replace Greek letters and mathematical operators with spoken words
  for (const [pattern, replacement] of GREEK_AND_MATH_SYMBOLS) {
    text = text.replace(pattern, replacement);
  }

  // 12. Handle '=' and '/' inside mathematical expressions
  text = text
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/(\b[A-Za-z0-9]+\b)\s*\/\s*(\b[A-Za-z0-9]+\b)/g, '$1 over $2');

  // 13. Clean up excessive punctuation and whitespace
  text = text
    .replace(/[_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();

  return text;
}

export const prepareScientificTextForSpeech = prepareScientificSpeechText;

/**
 * Splits spoken text into natural sentence chunks (~180-240 chars max per chunk)
 * so Web Speech API engines never stall or cut off on long multi-paragraph explanations.
 */
export function splitTextIntoSpeechChunks(spokenText: string, maxChunkLength = 220): string[] {
  const cleaned = spokenText.trim();
  if (!cleaned) return [];

  // Split by sentence boundaries first
  const rawSentences = cleaned
    .split(/(?<=[.!?;:])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of rawSentences) {
    if (!current) {
      if (sentence.length <= maxChunkLength) {
        current = sentence;
      } else {
        // Split very long sentence by commas or clauses
        const parts = sentence.split(/,\s+/);
        let sub = '';
        for (const p of parts) {
          if ((sub + ', ' + p).trim().length <= maxChunkLength) {
            sub = sub ? `${sub}, ${p}` : p;
          } else {
            if (sub) chunks.push(sub.trim());
            sub = p;
          }
        }
        if (sub) current = sub.trim();
      }
    } else if ((current + ' ' + sentence).length <= maxChunkLength) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [cleaned];
}

/**
 * Global singleton manager for AI response voice playback across Tech-Anatomix.
 * Guarantees that only one AI response speaks at a time across all chat interfaces.
 */
class AiSpeechManager {
  private activeId: string | null = null;
  private status: SpeechPlaybackStatus = 'idle';
  private errorMessage: string | null = null;
  private listeners = new Set<SpeechStateListener>();
  private chunks: string[] = [];
  private currentChunkIndex = 0;
  private sessionToken = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined'
    );
  }

  public getState() {
    return {
      activeId: this.activeId,
      status: this.isSupported() ? this.status : ('unsupported' as SpeechPlaybackStatus),
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Ignore listener errors
      }
    });
  }

  private selectPreferredVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
    try {
      const voices = synth.getVoices();
      if (!voices || voices.length === 0) return null;

      // Prefer clear English natural voices
      const preferred =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Microsoft'))
        ) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
        voices[0];

      return preferred || null;
    } catch {
      return null;
    }
  }

  public play(id: string, rawText: string) {
    if (!this.isSupported()) {
      this.activeId = id;
      this.status = 'unsupported';
      this.errorMessage = 'Voice playback is not supported in this browser.';
      this.notify();
      return;
    }

    const synth = window.speechSynthesis;

    // Cancel any existing speech immediately (enforces single active speech rule)
    this.sessionToken += 1;
    const token = this.sessionToken;

    try {
      synth.cancel();
    } catch {
      // Ignore cancel errors
    }

    const spokenText = prepareScientificSpeechText(rawText);
    if (!spokenText) {
      this.activeId = null;
      this.status = 'idle';
      this.notify();
      return;
    }

    this.chunks = splitTextIntoSpeechChunks(spokenText);
    this.currentChunkIndex = 0;
    this.activeId = id;
    this.status = 'playing';
    this.errorMessage = null;
    this.notify();

    this.speakCurrentChunk(token);
  }

  private speakCurrentChunk(token: number) {
    if (token !== this.sessionToken || !this.isSupported()) return;

    if (this.currentChunkIndex >= this.chunks.length) {
      this.activeId = null;
      this.status = 'idle';
      this.currentUtterance = null;
      this.notify();
      return;
    }

    const synth = window.speechSynthesis;
    const chunkText = this.chunks[this.currentChunkIndex];

    try {
      const utterance = new window.SpeechSynthesisUtterance(chunkText);
      const voice = this.selectPreferredVoice(synth);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (token !== this.sessionToken) return;
        this.currentChunkIndex += 1;
        if (this.currentChunkIndex < this.chunks.length && this.status === 'playing') {
          this.speakCurrentChunk(token);
        } else if (this.currentChunkIndex >= this.chunks.length) {
          this.activeId = null;
          this.status = 'idle';
          this.currentUtterance = null;
          this.notify();
        }
      };

      utterance.onerror = (event: any) => {
        if (token !== this.sessionToken) return;
        // 'interrupted' or 'canceled' is normal when user stops or switches playback
        if (event?.error === 'interrupted' || event?.error === 'canceled') {
          return;
        }
        this.status = 'error';
        this.errorMessage = 'Audio playback was interrupted.';
        this.currentUtterance = null;
        this.notify();
      };

      this.currentUtterance = utterance;
      synth.speak(utterance);
    } catch {
      this.status = 'error';
      this.errorMessage = 'Could not start speech synthesis.';
      this.notify();
    }
  }

  public pause(id?: string) {
    if (!this.isSupported()) return;
    if (id && this.activeId !== id) return;
    if (this.status !== 'playing') return;

    try {
      window.speechSynthesis.pause();
      this.status = 'paused';
      this.notify();
    } catch {
      // Fallback: if pause is unsupported by OS engine, stop cleanly
      this.stop(id);
    }
  }

  public resume(id?: string) {
    if (!this.isSupported()) return;
    if (id && this.activeId !== id) return;
    if (this.status !== 'paused') return;

    try {
      window.speechSynthesis.resume();
      this.status = 'playing';
      this.notify();
    } catch {
      // Fallback: re-speak from current chunk index
      this.status = 'playing';
      this.notify();
      this.speakCurrentChunk(this.sessionToken);
    }
  }

  public stop(id?: string) {
    if (id && this.activeId && this.activeId !== id) return;
    this.sessionToken += 1;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.currentUtterance = null;
    this.activeId = null;
    this.status = 'idle';
    this.errorMessage = null;

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel errors
      }
    }
    this.notify();
  }
}

export const aiSpeechManager = new AiSpeechManager();
